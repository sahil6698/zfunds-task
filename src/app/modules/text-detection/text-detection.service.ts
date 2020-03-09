import {HttpException, Injectable} from "@nestjs/common";
import vision from '@google-cloud/vision';
import AWS from 'aws-sdk'
@Injectable()
export default class ImageDetectionService {
    public async getImageText(fileToUpload): Promise<{
        name: string,
        dateOfBirth: string
    }> {
        try {
            AWS.config.update({
                accessKeyId: process.env.AWS_ACCESS_ID,
                secretAccessKey: process.env.AWS_SECRET_KEY
            });
            const s3 = new AWS.S3();
            const visionClient = new vision.ImageAnnotatorClient();
            const [result] = await visionClient.documentTextDetection(fileToUpload.buffer);
            const {textAnnotations} = result;
            const {name, dateOfBirth} = this.getNameAndDOBFromVisionRes(textAnnotations);
            const fileName = name + " " + dateOfBirth + " " + Date.now();
            await this.s3Upload(s3, fileToUpload, fileName);
            return {
                name,
                dateOfBirth
            }
        } catch (e) {
            throw new HttpException(`Error occurred: e${e.message}`, 400);
        }
    }

    private async s3Upload(s3, fileToUpload, fileName) {
        let fileTypeOnS3;
        if (fileToUpload.mimeType === 'image/jpeg' || 'image/jpg') {
            fileTypeOnS3 = 'jpeg'
        } else if (fileToUpload.mimeType === 'image/png') {
            fileTypeOnS3 = 'png'
        } else{
            throw new HttpException('Unsupported file', 400);
        }
        const s3Params = {
            Bucket: 'zfunds-task',
            Body : fileToUpload.buffer,
            Key : "pan_uploads/"+fileName+fileTypeOnS3,
        };
        return s3.upload(s3Params).promise()
    }

    private async s3Get(s3, fileKey) {
        const s3Params = {
            Bucket: 'zfunds-task',
            Key : fileKey,
        };
        return s3.getObject(s3Params).promise()
    }

    private getNameAndDOBFromVisionRes(textAnnotations): {
        name: string,
        dateOfBirth: string
    } {
        let name, dateOfBirth;
        let flag = false;
        for(const textAnnotation of textAnnotations) {
            const  {description} = textAnnotation;
            const separatedByEndOfLine = description.split('\n');
            const arrLen = separatedByEndOfLine.length;
            if (name === undefined) {
                const indexOfName = separatedByEndOfLine.indexOf('ATH/Name');
                if (indexOfName === -1|| indexOfName === arrLen) {
                    continue;
                }
                name = separatedByEndOfLine[indexOfName + 1];
            }
            if(dateOfBirth === undefined) {
                const indexOfDateOfBirth = separatedByEndOfLine.indexOf('Date of Birth');
                if (indexOfDateOfBirth === -1 || indexOfDateOfBirth === arrLen) {
                    continue;
                }
                dateOfBirth = separatedByEndOfLine[indexOfDateOfBirth+1];
            }
            if (dateOfBirth !== undefined && name!==undefined) {
                flag = true;
                break;
            }
        }
        if (flag) {
            return {
                name,
                dateOfBirth
            }
        } else {
            throw new HttpException('Name and Date of birth could not be determined from the image', 400);
        }
    }

}

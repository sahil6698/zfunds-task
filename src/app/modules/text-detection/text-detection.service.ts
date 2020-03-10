import {HttpException, Injectable} from "@nestjs/common";
import vision from '@google-cloud/vision';
import AWS from 'aws-sdk'
import S3 from "aws-sdk/clients/s3";
@Injectable()
export default class ImageDetectionService {
    private readonly s3: S3;
    constructor() {
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_ID,
            secretAccessKey: process.env.AWS_SECRET_KEY
        });
        this.s3 = new AWS.S3();
    }
    public async getImageText(fileToUpload): Promise<{
        name: string,
        dateOfBirth: string
    }> {
        try {
            const visionClient = new vision.ImageAnnotatorClient();
            const [result] = await visionClient.documentTextDetection(fileToUpload.buffer);
            const {textAnnotations} = result;
            const {name, dateOfBirth} = this.getNameAndDOBFromVisionRes(textAnnotations);
            const fileName = name +  "_" + Date.now();
            if (name.length > 0 && dateOfBirth.length > 0) {
                await this.s3Upload(fileToUpload, fileName);
            }
            return {
                name,
                dateOfBirth
            }
        } catch (e) {
            throw new HttpException(`Error occurred: ${e.message}`, 400);
        }
    }

    private async s3Upload(fileToUpload, fileName) {
        let fileTypeOnS3;
        if (fileToUpload.mimeType === 'image/jpeg' || 'image/jpg') {
            fileTypeOnS3 = '.jpeg'
        } else if (fileToUpload.mimeType === 'image/png') {
            fileTypeOnS3 = '.png'
        } else{
            throw new HttpException('Unsupported file', 400);
        }
        const s3Params = {
            Bucket: 'zfunds-task',
            Body : fileToUpload.buffer,
            Key : "pan_uploads/"+fileName+fileTypeOnS3,
        };
        return this.s3.upload(s3Params).promise();
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
        let isPAN = false;
        for(const textAnnotation of textAnnotations) {
            const  {description} = textAnnotation;
            if (!isPAN) {
                if (description.includes('Permanent Account Number Card')) {
                    isPAN = true;
                }
            }
            if (name === undefined) {
                let indexOfName;
                indexOfName = description.indexOf('/Name\n');
                let nameIndexToIncrement = 6;
                if (indexOfName === -1){
                    indexOfName = description.indexOf('/ Name\n');
                    nameIndexToIncrement = 7;
                }
                const strLen = description.length;
                if (indexOfName === -1 || indexOfName+nameIndexToIncrement >= strLen){
                    continue;
                } else {
                    const nameSubString = description.slice(indexOfName+nameIndexToIncrement);
                    const nameEndingIndex = nameSubString.indexOf('\n');
                    name = nameSubString.slice(0, nameEndingIndex);
                }
            }
            if (dateOfBirth === undefined) {
                const indexOfDOB = description.indexOf('Date of Birth\n');
                const strLen = description.length;
                if (indexOfDOB === -1 || indexOfDOB+14 >= strLen){
                    continue;
                } else {
                    const dobSubString = description.slice(indexOfDOB+14);
                    const dobEndingIndex = dobSubString.indexOf('\n');
                    dateOfBirth = dobSubString.slice(0, dobEndingIndex);
                }
            }
            if (dateOfBirth !== undefined && name!==undefined) {
                flag = true;
                break;
            }
        }
        if(isPAN) {
           if (flag) {
               return {
                   name, dateOfBirth
               }
           } else {
               throw new HttpException(' Please try again with a clear photo, ' +
                   'Name and DOB could not be determined from the uploaded image', 400);
           }
        } else {
            throw new HttpException(' Uploaded image is not a valid PAN photo', 400);
        }
    }

}

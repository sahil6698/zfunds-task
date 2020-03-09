import {Body, Controller, Post, UploadedFile, UseInterceptors} from "@nestjs/common";
import ImageDetectionService from "./text-detection.service";
import ImageDetectionDto from "./dto/image-detection.dto";
import ValidationPipe from "../../pipes/validation.pipes";
import {FileInterceptor} from "@nestjs/platform-express";


@Controller('text-detection')
export default class TextDetectionController {
    constructor(
        private readonly imageDetectionService: ImageDetectionService,
    ) {}

    @Post('')
    @UseInterceptors(FileInterceptor('image', {
        limits: {
            fileSize: 5242880,
        }
    }))
    public async getImageText(@UploadedFile() image) {
        return this.imageDetectionService.getImageText(image);
    }
}

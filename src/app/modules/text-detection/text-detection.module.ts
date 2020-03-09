import { Module } from '@nestjs/common';
import TextDetectionController from "./text-detection.controller";
import ImageDetectionService from "./text-detection.service";
@Module({
    controllers: [TextDetectionController],
    providers: [ImageDetectionService]
})
export class TextDetectionModule {}

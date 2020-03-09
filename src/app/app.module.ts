import { Module } from '@nestjs/common';
import {TextDetectionModule} from "./modules/text-detection/text-detection.module";
@Module({

  imports: [
      TextDetectionModule,
  ]
})
export class AppModule {}

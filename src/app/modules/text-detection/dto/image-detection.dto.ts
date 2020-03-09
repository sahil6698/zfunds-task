import {IsBase64} from "class-validator";

class ImageDetectionDto {
    @IsBase64()
    public image: string;
}
export default ImageDetectionDto;

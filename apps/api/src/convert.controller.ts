import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ConvertService } from "./convert.service";

interface ConvertRequest {
  code: string;
}

@Controller("convert")
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post("simple")
  async convertSimple(@Body() body: ConvertRequest) {
    if (!body.code || body.code.trim() === "") {
      throw new HttpException('Missing "code" field', HttpStatus.BAD_REQUEST);
    }
    return this.convertService.convert(body.code);
  }
}

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

interface ProjectFile {
  path: string;
  content: string;
}

interface ProjectConvertRequest {
  files: ProjectFile[];
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

  @Post("project")
  async convertProject(@Body() body: ProjectConvertRequest) {
    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      throw new HttpException(
        'Missing "files" array. Provide [{ path, content }] entries.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.convertService.convertProject(body.files);
  }
}

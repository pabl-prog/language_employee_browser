import {
  Controller,
  Get,
  Query,
  BadRequestException,
  InternalServerErrorException,
  HttpCode,
} from "@nestjs/common";
import { EmployeeRepoLanguageService } from "./employee-repo-language.service";
import { EmployeeRepoLanguage } from "./entity/employee-repo-language.entity";

@Controller()
export class AppController {
  constructor(private readonly employeeRepoLanguageService: EmployeeRepoLanguageService) {}

  /**
   * EXAMPLE endpoint for a search in the dataset
   * @param lang
   * @returns
   */
  @Get("browse/members")
  async search(
    @Query("lang") lang: string,
  ): Promise<string[]> {
    if (lang) {
      try {
        const entries = await this.employeeRepoLanguageService.searchMembers(lang);
        const usernames: Set<string> = new Set<string>();
        entries.forEach((entry) => usernames.add(entry.username));
        return Array.from(usernames);
      } catch (e) {
        throw new InternalServerErrorException();
      }
    } else {
      throw new BadRequestException();
    }
  }

  @Get("all")
  async getAll() {
    try {
      return this.employeeRepoLanguageService.getAll();
    } catch(e) {
      throw new InternalServerErrorException();
    }
  }
}

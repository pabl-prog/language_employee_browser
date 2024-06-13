import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { Octokit } from "@octokit/rest";
import { GhUser } from "./interfaces/GhUser.interface";
import { GhRepository } from "./interfaces/GhRepository.interface";
import { Cron } from "@nestjs/schedule";

import { EmployeeRepoLanguage } from "./entity/employee-repo-language.entity";

@Injectable()
export class EmployeeRepoLanguageService {
  private logger = new Logger(EmployeeRepoLanguageService
  .name);

  private octokit: Octokit;

  constructor(
    private configService: ConfigService,
    @InjectRepository(EmployeeRepoLanguage)
    private employeeRepoLanguageRepo: Repository<EmployeeRepoLanguage>,
  ) {
    this.octokit = new Octokit({
      auth: this.configService.get<string>("GH_AUTH_TOKEN"),
    });
  }

  async searchMembers(lang: string): Promise<EmployeeRepoLanguage[]> {
    return await this.employeeRepoLanguageRepo.find({ where: { lang } });
  }

  async getAll(): Promise<EmployeeRepoLanguage[]> {
    return await this.employeeRepoLanguageRepo.find();
  }

  /**
   * Cront task to sync the data from the Github api with the database every day at 10 PM.
   */
  @Cron("0 22 * * *")
  async syncData() {
    try {
      const org = this.configService.get<string>("ORGANIZATION");
      this.logger.log(`Start Sync Operation for Organization "${org}"`);
      this.logger.log(`Starting to fetch data`);
      const dataSet: Set<EmployeeRepoLanguage> = await this.getData(org);
      this.logger.log(`Finished fetching ${dataSet.size} entries`);
      this.logger.log(`Save data to DB`);
      await this.saveData(dataSet);
      this.logger.log("Data saved to DB");
      this.logger.log("Done!");
    } catch (e) {
      this.logger.error(e.message, e.stack);
    }
  }

  /**
   * Method to retrieve Data about the organisation members, their repositories and used languages.
   * @param org - organisation to retrieve data for
   * @returns a Set of EmployeeRepoLanguage objects
   */
  async getData(org: string): Promise<Set<EmployeeRepoLanguage>> {
    this.logger.debug(`Retrieve data for organization ${org}`);
    const entriesSet = new Set<EmployeeRepoLanguage>();
    const members: GhUser[] = await this.getOrnaizationMembers(org);
    for (const memberLogin of members.map((member) => member.login)) {
      this.logger.debug(`Fetch repository data for member: ${memberLogin}`);
      const repositories: GhRepository[] =
        await this.getMemberRepositories(memberLogin);
      for (const repository of repositories.map(
        (repository) => repository.name,
      )) {
        const languages = await this.getRepositoryLanguages(
          repository,
          memberLogin,
        );
        for (const language of Object.keys(languages)) {
          const entry = new EmployeeRepoLanguage();
          entry.organization = org;
          entry.username = memberLogin;
          entry.repo = repository;
          entry.lang = language;
          entriesSet.add(entry);
        }
      }
    }
    return entriesSet;
  }

  /**
   * Method that Saves a set of EmployeeRepoLanguage entities to the database
   * @param dataset - Set of EmployeeRepoLanguage to be saved
   */
  async saveData(dataset: Set<EmployeeRepoLanguage>) {
    await Promise.all(
      Array.from(dataset).map((entry: EmployeeRepoLanguage) =>
        this.employeeRepoLanguageRepo.save(entry),
      ),
    );
  }

  /**
   * Method that retrieves all members of an organization
   * @param org - organization name for which the members should be retrieved
   * @returns a list of members
   */
  async getOrnaizationMembers(org: string): Promise<GhUser[]> {
    try {
      return this.get<GhUser[]>("/orgs/{org}/members", { org });
    } catch (e) {
      console.error(e);
      throw new Error("Error while fetching organization members!");
    }
  }

  /**
   * Method that retrieves all repositories for a specific member
   * @param username - username for which the repositories should be retrieved
   * @returns a list of repositories
   */
  async getMemberRepositories(username: string): Promise<GhRepository[]> {
    try {
      return this.get<GhRepository[]>("/users/{username}/repos", { username });
    } catch (e) {
      throw new Error("Error while fetching user repositories!");
    }
  }

  /**
   * Method that retrieves all languages found in a repository for a given member
   * @param repo - repository name for which the languages should be returned
   * @param username - username of the repository owner
   * @returns an object consisting of the language as field and its usage in the repository as value
   */
  async getRepositoryLanguages(
    repo: string,
    username: string,
  ): Promise<Record<string, any>> {
    try {
      return this.get<any[]>("/repos/{username}/{repo}/languages", {
        repo,
        username,
      });
    } catch (e) {
      throw new Error("Error while fetching repository languages!");
    }
  }

  /**
   * Method to retrieve values from the Github Api over the octokit library with a GET request
   * @param path - target path values shoudl be retrieved from
   * @param params - parameters for the request
   * @returns
   */
  private async get<T>(path: string, params: Record<string, any>): Promise<T> {
    Object.assign(params.headers || {}, {
      headers: {
        ...params.headers,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    try {
      const apiResponse = await this.octokit.request(`GET ${path}`, params);
      return apiResponse.data as T;
    } catch (e) {
      console.error(e);
      throw new Error(`Error while fetching data from ${path}!`);
    }
  }
}

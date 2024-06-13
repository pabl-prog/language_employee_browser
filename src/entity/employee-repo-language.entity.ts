import { PrimaryColumn, Entity, Index } from "typeorm";

@Entity()
export class EmployeeRepoLanguage {
  @PrimaryColumn()
  organization: string;

  @PrimaryColumn()
  username: string;

  @PrimaryColumn()
  repo: string;

  @PrimaryColumn()
  lang: string;
}

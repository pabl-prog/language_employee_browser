import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { EmployeeRepoLanguageService } from "./employee-repo-language.service";
import { EmployeeRepoLanguage } from "./entity/employee-repo-language.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: ".db/db.sqlite3",
      entities: [EmployeeRepoLanguage],
      // Change to true on dev
      synchronize: false,
    }),
    TypeOrmModule.forFeature([EmployeeRepoLanguage]),
  ],
  controllers: [AppController],
  providers: [EmployeeRepoLanguageService],
})
export class AppModule {}

import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaService } from "./prisma.service"

export class PrismaClientFactory {
    static create(environment: string = "development"): PrismaService {
        let dbUrl = process.env.DATABASE_URL || "file:./sqlite.db"
        if (environment === "test") {
            dbUrl = process.env.TEST_DATABASE_URL || "file:./sqlite.db"
        }
        const adapter = new PrismaLibSql({ url: dbUrl })
        return new PrismaService({ adapter })
    }
}

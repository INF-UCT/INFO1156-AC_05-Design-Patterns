import { Injectable } from "@nestjs/common";
import { PrismaLibSql } from "@prisma/adapter-libsql";

@Injectable()
export class PrismaAdapterFactory {
    createAdapter() {
        const DATABASE_URL = "file:./sqlite.db";
        return new PrismaLibSql({ url: DATABASE_URL });
    }
}

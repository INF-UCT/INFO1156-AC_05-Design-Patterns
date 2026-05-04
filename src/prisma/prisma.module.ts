import { Global, Module } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { PrismaAdapterFactory } from "@/prisma/prisma.factory"

@Global()
@Module({
    providers: [PrismaAdapterFactory, PrismaService],
    exports: [PrismaService],
})
export class PrismaModule { }

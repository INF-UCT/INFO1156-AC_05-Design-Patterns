import { Global, Module } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { PrismaClientFactory } from "./prisma.factory"

@Global()
@Module({
    providers: [
        {
            provide: PrismaService,
            useFactory: () => {
                return PrismaClientFactory.create(process.env.NODE_ENV)
            },
        },
    ],
    exports: [PrismaService],
})
export class PrismaModule {}

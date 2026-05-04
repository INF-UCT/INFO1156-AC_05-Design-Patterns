import { PrismaClient } from "@prisma/client"
import { Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaAdapterFactory } from "@/prisma/prisma.factory"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor(private readonly adapterFactory: PrismaAdapterFactory) {
        const adapter = adapterFactory.createAdapter()

        super({ adapter })
    }

    async onModuleInit() {
        await this.$connect()
    }
}

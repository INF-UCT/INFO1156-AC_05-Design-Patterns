import { Injectable } from "@nestjs/common";
import { legacyModerationApi } from "@/posts/legacy-moderation.client";

export interface IModerationService {
    review(content: string): boolean;
}

@Injectable()
export class ModerationAdapter implements IModerationService {
    /**
     * Revisa el contenido utilizando la API heredada y adapta su salida 
     * a un valor booleano simple y fácil de entender:
     * true = Aprobado, false = Bloqueado.
     */
    review(content: string): boolean {
        const moderation = legacyModerationApi.review(content);

        if (moderation === "BLOCK") {
            return false;
        } else if (typeof moderation === "number") {
            return moderation >= 1; // Si es < 1, false (bloqueado)
        } else if (typeof moderation === "object") {
            return !!("pass" in moderation && moderation.pass);
        } else if (moderation === "OK") {
            return true;
        }

        return false;
    }
}

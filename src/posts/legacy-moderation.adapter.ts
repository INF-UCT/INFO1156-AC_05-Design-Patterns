import { Injectable } from '@nestjs/common';
import { ContentModerator } from './moderation.interface';
import { legacyModerationApi } from './legacy-moderation.client';

@Injectable()
export class LegacyModerationAdapter implements ContentModerator {
  
  public async moderateContent(content: string): Promise<boolean> {
    // 1. Ejecutamos la lógica del subsistema legado
    const result = legacyModerationApi.review(content);

    // 2. Traducimos la respuesta mixta a la interfaz esperada (boolean)
    if (result === "BLOCK") {
      return false;
    }

    if (result === "OK" || result === 1) {
      return true;
    }

    if (typeof result === 'object' && result !== null && 'pass' in result) {
      return result.pass === true;
    }

    // Por seguridad, si el formato es desconocido, bloqueamos
    return false;
  }
}

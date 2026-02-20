import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

export const supabaseProvider = {
  provide: 'SUPABASE',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return createClient(
      configService.get<string>('SUPABASE_URL'),
      configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  },
};

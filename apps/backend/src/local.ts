import { api } from './api/main';

async function bootstrap() {
  try {
    console.log('🚀 Starting FND EasyFlow API...');
    await api();
    console.log('✅ FND EasyFlow API running successfully!');
  } catch (error) {
    console.error('❌ Failed to start FND EasyFlow API:', error);
    process.exit(1);
  }
}

bootstrap();

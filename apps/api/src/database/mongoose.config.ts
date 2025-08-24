import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getMongooseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  const uri = configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/production-tool';
  const dbName = configService.get<string>('MONGODB_DB_NAME') || 'production-tool';
  
  return {
    uri,
    dbName,
    retryWrites: true,
    w: 'majority',
    authSource: 'admin',
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 2,
  };
};

export const getTestMongooseConfig = (): MongooseModuleOptions => {
  return {
    uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/production-tool-test',
    dbName: 'production-tool-test',
    retryWrites: true,
    w: 'majority',
    connectTimeoutMS: 5000,
    socketTimeoutMS: 20000,
    serverSelectionTimeoutMS: 5000,
  };
};
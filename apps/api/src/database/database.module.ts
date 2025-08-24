import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getMongooseConfig } from './mongoose.config';

// Import schemas
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { User, UserSchema } from './schemas/user.schema';
import { Project, ProjectSchema } from './schemas/project.schema';
import { Artist, ArtistSchema } from './schemas/artist.schema';
import { Booking, BookingSchema } from './schemas/booking.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getMongooseConfig(configService),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Artist.name, schema: ArtistSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
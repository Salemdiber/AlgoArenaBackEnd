import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entities/user.entity';
@Module({
  imports: [
  TypeOrmModule.forRoot({ 
  type: 'mongodb', // Déclare que c'est MongoDB
  host: 'localhost', // L'adresse de ton serveur MongoDB
  port: 27017, // Le port de MongoDB
  database: 'algoarena', // Nom de la base de données
  entities: [User], // Liste des entités
  synchronize: true, // Synchroniser les entités avec la BD
  }), 
  UserModule
],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}

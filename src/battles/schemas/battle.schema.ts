import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BattleStatus, BattleType, BotDifficulty } from '../battle.enums';

export type BattleDocument = Battle & Document;

@Schema({ timestamps: true })
export class Battle {
  @Prop({ required: true, index: true })
  idBattle: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ default: null })
  opponentId: string;

  @Prop({ required: true })
  roundNumber: number;

  @Prop({ required: true, enum: BattleStatus, default: BattleStatus.PENDING })
  battleStatus: BattleStatus;

  @Prop({ required: true })
  challengeId: string;

  @Prop({ required: true })
  selectChallengeType: string;

  @Prop({ required: true, enum: BotDifficulty, default: BotDifficulty.MEDIUM })
  botDifficulty: BotDifficulty;

  @Prop({ default: null })
  winnerUserId: string;

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date })
  endedAt: Date;

  @Prop({ required: true, enum: BattleType })
  battleType: BattleType;
}

export const BattleSchema = SchemaFactory.createForClass(Battle);

BattleSchema.index({ battleStatus: 1 });
BattleSchema.index({ createdAt: -1 });
BattleSchema.index({ userId: 1, createdAt: -1 });
BattleSchema.index({ opponentId: 1, createdAt: -1 });
BattleSchema.index({ challengeId: 1 });

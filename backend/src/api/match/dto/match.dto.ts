import { IsIn, IsMongoId } from 'class-validator';

export class SwipeDto {
  @IsMongoId()
  targetId: string;

  @IsIn(['like', 'pass'])
  action: 'like' | 'pass';
}

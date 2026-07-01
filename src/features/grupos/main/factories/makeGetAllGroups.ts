import { GetAllGroups } from '../../domain/usecases/GetAllGroups';
import { MockGroupRepository } from '../../infra/repositories/MockGroupRepository';

export const makeGetAllGroups = (): GetAllGroups => {
  const repository = new MockGroupRepository();
  return new GetAllGroups(repository);
};

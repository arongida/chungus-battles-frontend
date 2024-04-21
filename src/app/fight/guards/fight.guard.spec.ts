import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { fightGuard } from './fight.guard';

describe('fightGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => fightGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

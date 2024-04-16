import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { draftGuard } from './draft.guard';

describe('draftGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => draftGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

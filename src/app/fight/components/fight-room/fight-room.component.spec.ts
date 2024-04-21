import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightRoomComponent } from './fight-room.component';

describe('FightRoomComponent', () => {
  let component: FightRoomComponent;
  let fixture: ComponentFixture<FightRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightRoomComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FightRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterAvatarComponent } from './character-avatar.component';

describe('CharacterAvatarComponent', () => {
  let component: CharacterAvatarComponent;
  let fixture: ComponentFixture<CharacterAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterAvatarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CharacterAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

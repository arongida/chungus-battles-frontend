import { Routes } from '@angular/router';
import { JoinFormComponent } from './join-form/join-form.component';
import { DraftRoomComponent } from './draft/components/draft-room/draft-room.component';
import { draftGuard } from './draft/guards/draft.guard';
import { FightRoomComponent } from './fight/components/fight-room/fight-room.component';
import { EndComponent } from './end/end.component';
export const routes: Routes = [
  {
    path: '',
    component: JoinFormComponent,
    pathMatch: 'full',
  },
  {
    path: 'draft/:id',
    component: DraftRoomComponent,
    pathMatch: 'full',
    canActivate: [draftGuard],
  },
  {
    path: 'fight/:id',
    component: FightRoomComponent,
    pathMatch: 'full',
    canActivate: [draftGuard],
  },
  {
    path: 'end',
    component: EndComponent,
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

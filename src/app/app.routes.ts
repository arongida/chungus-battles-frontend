import { Routes } from '@angular/router';
import { JoinFormComponent } from './join-form/join-form.component';
import { DraftRoomComponent } from './draft/components/draft-room/draft-room.component';
import { runGuard } from './common/guards/run.guard';
import { FightRoomComponent } from './fight/components/fight-room/fight-room.component';
import { EndComponent } from './end/end.component';
export const routes: Routes = [
  {
    path: '',
    component: JoinFormComponent,
    pathMatch: 'full',
  },
  {
    // :id is the run's playerId (not a Colyseus sessionId) — see run.guard.ts.
    path: 'draft/:id',
    component: DraftRoomComponent,
    pathMatch: 'full',
    canActivate: [runGuard],
  },
  {
    path: 'fight/:id',
    component: FightRoomComponent,
    pathMatch: 'full',
    canActivate: [runGuard],
  },
  {
    path: 'end',
    component: EndComponent,
    pathMatch: 'full',
  },
  {
    path: 'replay/:id',
    loadComponent: () => import('./replay/replay-room.component').then(m => m.ReplayRoomComponent),
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

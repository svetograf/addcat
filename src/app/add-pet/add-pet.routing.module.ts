import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddPetComponent } from './add-pet.component';

const routes: Routes = [
  {
    path: '',
    component: AddPetComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddPetRoutingModule {}

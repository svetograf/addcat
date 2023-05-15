import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddPetComponent } from './add-pet.component';
import {AddPetRoutingModule} from "./add-pet.routing.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddPetRoutingModule
  ],
  declarations: [AddPetComponent]
})
export class AddPetModule {}

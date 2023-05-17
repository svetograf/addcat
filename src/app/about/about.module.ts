import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { AboutComponent } from './about.component';
import {AboutRoutingModule} from "./about.routing.module";

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AboutRoutingModule
  ],
  declarations: [AboutComponent]
})
export class AboutModule {}

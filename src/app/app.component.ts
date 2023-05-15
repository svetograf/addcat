import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Add a pet to my selfie', url: '/add-pet', icon: 'logo-octocat'},
    { title: 'About', url: '/about', icon: 'information-circle-outline' },
  ];
  constructor() {}
}

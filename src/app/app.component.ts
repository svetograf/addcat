import { Component } from '@angular/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Main', url: '/folder/inbox', icon: 'mail' },
    { title: 'My pets', url: '/folder/favorites', icon: 'heart' },
    { title: 'Account', url: '/folder/spam', icon: 'warning' },
  ];
  constructor() {}
}

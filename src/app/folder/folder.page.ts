import { Component, OnInit } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  public folder = 'AddPet';
  previewImage$ = new BehaviorSubject<string | null>(null)
  constructor() {}

  ngOnInit() {

  }

  loadImageFromDevice($event: Event) {
    const element = $event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      const reader = new FileReader();
      reader.readAsDataURL(fileList[0]);
      reader.onload = () => this.previewImage$.next(reader.result as string);
      reader.onerror = (error) => console.log(error);
    }
  }
}

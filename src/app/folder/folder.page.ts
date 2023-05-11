import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, filter, Subject, switchMap, tap} from "rxjs";
import {
  FaceMesh, FACEMESH_FACE_OVAL
} from "@mediapipe/face_mesh";
import {drawConnectors} from "@mediapipe/drawing_utils";

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, AfterViewInit {
  @ViewChild('previewImage') previewImageRef?:ElementRef;
  @ViewChild('canvas') canvasRef?:ElementRef;

  public folder = 'AddPet';
  faceMesh: FaceMesh;
  previewImage$ = new BehaviorSubject<string | null>(null);
  imageLoaded$ = new Subject<void>();
  showSpinner$ = new BehaviorSubject(false);
  faceDetected$ = new BehaviorSubject(false);

  width: number = 0;
  height: number = 0;

  originalWidth: number = 0;
  originalHeight: number = 0;

  constructor() {
    this.faceMesh = new FaceMesh({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }});
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults(this.processResults.bind(this));
  }

  loadImageFromDevice($event: Event) {
    this.previewImage$.next(null);
    this.faceDetected$.next(false);
    const element = $event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      const reader = new FileReader();
      reader.readAsDataURL(fileList[0]);
      reader.onload = () => {
        const img = new Image;
        img.onload = () => {
          this.originalWidth = img.width ?? 0;
          this.originalHeight = img.height ?? 0;
          this.imageLoaded$.next();
        }
        if (reader.result){
          img.src = reader.result as string;
        }
        this.previewImage$.next(reader.result as string);
      };
      reader.onerror = (error) => console.log(error);
    }
  }

  processResults(results: any){
    console.log(results);
    this.showSpinner$.next(false);

    this.width = this.previewImageRef?.nativeElement.clientWidth;
    this.height = this.previewImageRef?.nativeElement.clientHeight;

    if(this.canvasRef?.nativeElement){
      this.canvasRef.nativeElement.width = this.width;
      this.canvasRef.nativeElement.height = this.height;
      const canvasCtx = this.canvasRef?.nativeElement.getContext('2d');
      canvasCtx.clearRect(0, 0, this.width, this.height);
      canvasCtx.drawImage(
        results.image, 0, 0, this.width, this.height);
      if (results.multiFaceLandmarks) {
        this.faceDetected$.next(true);
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
        }
      } else {
        this.faceDetected$.next(false);
      }
      canvasCtx.restore();
    }
  }

  ngAfterViewInit(): void {

    this.previewImage$.pipe(
      filter(img => !!img),
      tap(() => this.showSpinner$.next(true)),
      switchMap(() => this.imageLoaded$),
      tap(() => {
        console.log(`image dimensions are ${this.width}x${this.height}`);
          console.log('send image to the mediapipe');
          this.faceMesh.send({image: this.previewImageRef?.nativeElement});
      }),
    )
    .subscribe();
  }

  ngOnInit(): void {
  }
}

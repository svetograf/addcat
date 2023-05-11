import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {BehaviorSubject, filter, Subject, switchMap, tap} from "rxjs";
import {
  FaceMesh, FACEMESH_FACE_OVAL
} from "@mediapipe/face_mesh";
import {drawConnectors} from "@mediapipe/drawing_utils";
import FloodFill from "q-floodfill";

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, AfterViewInit {
  @ViewChild('previewImage') previewImageRef?:ElementRef;
  @ViewChild('canvas') canvasRef?:ElementRef;
  @ViewChild('mask') maskRef?:ElementRef;
  @ViewChild('canvasContainer') canvasContainerRef?:ElementRef;

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

  readonly NOSETIP = 33;
  readonly MASK_COLOR = '#E0E0E0';

  constructor() {
    this.faceMesh = new FaceMesh({locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults(this.processFaceMeshResults.bind(this));
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

  processFaceMeshResults(results: any){
    this.showSpinner$.next(false);

    this.width = this.previewImageRef?.nativeElement.clientWidth;
    this.height = this.previewImageRef?.nativeElement.clientHeight;

    if(this.canvasRef?.nativeElement && this.maskRef?.nativeElement){
      this.resetCanvas();
      const photoCanvasCtx = this.canvasRef?.nativeElement.getContext('2d');
      const maskCanvasCtx = this.maskRef?.nativeElement.getContext('2d');
      photoCanvasCtx.clearRect(0, 0, this.width, this.height);
      maskCanvasCtx.clearRect(0, 0, this.width, this.height);
      photoCanvasCtx.drawImage(results.image, 0, 0, this.width, this.height);
      console.log(results.multiFaceLandmarks);
      if (results.multiFaceLandmarks) {
        this.faceDetected$.next(true);
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(maskCanvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
        }
        const imgData = maskCanvasCtx.getImageData(0, 0, this.width, this.height)
        const floodFill = new FloodFill(imgData)
        floodFill.fill(
          this.MASK_COLOR,
          Math.floor(this.width * results.multiFaceLandmarks[0][this.NOSETIP].x),
          Math.floor(this.height * results.multiFaceLandmarks[0][this.NOSETIP].y),
          254)
        maskCanvasCtx.putImageData(floodFill.imageData, 0, 0)

      } else {
        this.faceDetected$.next(false);
      }
      photoCanvasCtx.restore();
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

  private resetCanvas(){
    if(this.canvasRef?.nativeElement && this.maskRef?.nativeElement && this.canvasContainerRef?.nativeElement){
      this.canvasContainerRef.nativeElement.width = this.width;
      this.canvasContainerRef.nativeElement.height = this.height;
      this.canvasRef.nativeElement.width = this.width;
      this.canvasRef.nativeElement.height = this.height;
      this.maskRef.nativeElement.width = this.width;
      this.maskRef.nativeElement.height = this.height;
    }
  }
}

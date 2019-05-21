import { Component, OnInit } from '@angular/core';
import { from, fromEvent, Subject, merge, pipe } from 'rxjs';
import { switchMap, takeUntil, repeat, tap, map, throttleTime, distinctUntilChanged, filter, toArray, sequenceEqual, pluck } from 'rxjs/operators';




@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'LockScreenProject';

  


  ngOnInit()
  {
    const createPadObject = (id, rectange) => ({

      id: id,
     
      left: rectange.left,

      right: rectange.right,

      top: rectange.top,

      bottom: rectange.bottom
    });
    
    const setResultText = text => document.getElementById('result').innerText = text;
    
    const setPasswordPads = color => Array.from(document

      .querySelectorAll('.cell'))

      .forEach((v: HTMLElement) => v.style.background = color)
    
    const getPad = id => document.getElementById(`c${id}`);
    
     const pads = Array

      .from({ length: 9 }, (_, n) => n + 1)

      .map(v => createPadObject(v, getPad(v).getBoundingClientRect()));
    
     const markTouchedPad = v => {

      const pad = getPad(v);

      pad.style.background = 'lightgrey';

      if (!pad.animate) return; //animate does not work in IE

      // const animation: any = [
      //   { transform: 'scale(0.9)' },
      //   { transform: 'scale(1)' }
      // ];
      // const animationOptions = {
      //   duration: 300,
      //   iterations: 1
      // };
      // pad.animate(animation, animationOptions);

      document.getSelection().removeAllRanges();

    };
    
     const setResult = result => {

      setPasswordPads(result ? 'MediumSeaGreen' : 'IndianRed');

      setResultText('Password ' + (result ? 'matches :)' : 'does not match :('));

    }
    
     const displaySelectedNumbersSoFar = v =>
      document.getElementById('result').textContent += v;
    
      const resetPasswordPad = () => {
        setResultText('');
        setPasswordPads('gray');
     
    }

    
//--------------------------------
    const sub = new Subject();
    const expectedPasswordUpdate$ = fromEvent(document.getElementById('expectedPassword'), 'keyup')
    .pipe(

      map((e: any) => e.target.value),

      tap(pass => sub.next(pass.split('').map(e => parseInt(e))))
    );

    let expectedPassword = [1, 2, 3, 6];
    const expectedPassword$ = sub.pipe(tap((v: any) => expectedPassword = v));

    const takeMouseSwipe = pipe(
    // take mouse moves
    switchMap(_ => fromEvent(document, 'mousemove')),
    // once mouse is up, we end swipe
    takeUntil(fromEvent(document, 'mouseup')),

    throttleTime(50)
  );

  const checkIfPasswordMatch = password => from(password).pipe(sequenceEqual(from(expectedPassword)));

  const getXYCoordsOfMousePosition = ({ clientX, clientY }: MouseEvent) => ({ x: clientX, y: clientY });

  const findSelectedPad = v => pads.find(r =>
  v.x > r.left &&
  v.x < r.right &&
  v.y > r.top &&
  v.y < r.bottom);

  const getIdOfSelectedPad = pipe(
    filter(v => !!v),
    pluck('id'),
    distinctUntilChanged()
  );

  const actualPassword$ = fromEvent(document, 'mousedown')
  .pipe(
    // new stream so reset password pad and take swipe until mouse up
    tap(resetPasswordPad),
    takeMouseSwipe,
    // as we swipe, we mark pads as touchedand and display selected numbers
    map(getXYCoordsOfMousePosition),
    map(findSelectedPad),
    getIdOfSelectedPad,
    tap(markTouchedPad),
    tap(displaySelectedNumbersSoFar),
    // we need an array of numbers from current swipe which we can pass to checkIfPasswordMatch
    toArray(),
    // on mouse up (swipe end), switchMap to new stream to check if password match
    switchMap(checkIfPasswordMatch),
    tap(setResult),
    // takeUntil inside takeMouseSwipe terminated stream so we repeat from beginning (mousedown) 
    repeat()
  )

  merge(
    expectedPassword$,
    expectedPasswordUpdate$,
    actualPassword$
  ).subscribe();


//--------------------------




  }


}

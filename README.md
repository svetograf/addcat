# About
This is a demonstration app written by Maxim Shevchenko https://github.com/svetograf
to demonstrate current AI abilities in a field of image processing.


On the first stage image is being processed by mediapipe/facemesh
to detect faces. Then results are used to generate masks
and cut out faces via canvas manipulations. On the last stage
transparent square image with faces on it is sent to the
OpenAI API and the resulting image is acquired.

P.S. Don't put a blame on me for some ugly animals.
Use it just for fun.
Remember that AI is still learning =)

# To start the app

1. Clone the repo
2. cd to the directory
3. ```yarn```
4. Add your api key which you can acquire at https://platform.openai.com/account/api-keys for free to the environment.ts
5. ```ionic serve```

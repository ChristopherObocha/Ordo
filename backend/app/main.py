from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Backend is working!"}

@app.get("/hello")
def hello():
    return {"message": "Hello, World!"}
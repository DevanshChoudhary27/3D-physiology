from flask import Flask, render_template, request
import joblib
import pandas as pd

app = Flask(__name__)

model = joblib.load("ergonomic_model.pkl")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=['POST'])
def predict():

    data = [[
        int(request.form['age']),
        int(request.form['screen']),
        int(request.form['sitting']),
        int(request.form['neck']),
        int(request.form['back']),
        int(request.form['eye']),
        int(request.form['breaks'])
    ]]

    df = pd.DataFrame(data,
        columns=['age','screen_hours','sitting_hours',
                 'neck_pain','back_pain','eye_strain','breaks'])

    result = model.predict(df)[0]

    # Messages
    if result == 2:
        msg = "HIGH RISK"
        cls = "high"
        advice = "Take frequent breaks and consult doctor if pain continues."
    elif result == 1:
        msg = "MEDIUM RISK"
        cls = "medium"
        advice = "Do stretching exercises and improve posture."
    else:
        msg = "LOW RISK"
        cls = "low"
        advice = "Maintain good habits and follow 20-20-20 rule."

    # Simple exercise logic
    exercises = []

    if int(request.form['neck']) > 5:
        exercises += ["Neck rotation", "Chin tuck", "Side stretch"]

    if int(request.form['back']) > 5:
        exercises += ["Cat-cow stretch", "Child pose"]

    if int(request.form['eye']) > 5:
        exercises += ["20-20-20 rule", "Eye blinking"]

    return render_template("result.html",
                           msg=msg,
                           cls=cls,
                           advice=advice,
                           exercises=exercises)


if __name__ == "__main__":
    app.run(debug=True)

import altair as alt
import pandas as pd

# Load the sector performance data
data = pd.read_csv("/Users/nozomikaneda/Desktop/Northeastern University/Spring 2025 Semester/DS4200/DS4200_Credit_Ratings_Project/data/sector_performance.csv")

data_melted = data.melt(
    id_vars="Sector",
    value_vars=["Accuracy", "F1 Score", "Precision", "Recall"],
    var_name="Metric",
    value_name="Score"
)

chart = alt.Chart(data_melted).mark_bar().encode(
    x=alt.X("Score:Q", title="Score", scale=alt.Scale(domain=[0, 4])),
    y=alt.Y("Sector:N", title="Sector", sort="-x"),
    color=alt.Color("Metric:N", title="Metric", scale=alt.Scale(scheme="tableau10")),
    tooltip=[
        alt.Tooltip("Sector:N", title="Sector"),
        alt.Tooltip("Metric:N", title="Metric"),
        alt.Tooltip("Score:Q", title="Score", format=".2f")
    ]
).properties(
    title="Sector-Wise Model Performance Metrics",
    width=800,  
    height=500
).configure_title(
    fontSize=22,
    anchor="middle",
    color="black"
).configure_axis(
    labelFontSize=14,
    titleFontSize=16
).configure_legend(
    titleFontSize=14,
    labelFontSize=12,
    orient="bottom"  
)

output_path = "visualizations/altair_sector_performance.html"
chart.save(output_path)

print(f"Altair chart saved at {output_path}.")
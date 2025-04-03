import pandas as pd
import altair as alt
import os

df = pd.read_csv("/Users/nozomikaneda/Desktop/Northeastern University/Spring 2025 Semester/DS4200/DS4200_Credit_Ratings_Project/docs/data/normalized_ratios.csv")

# Key features from feature importance analysis
features = [
    "Operating Margin", "EBITDA Margin", "Current Ratio",
    "Operating Cash Flow Per Share", "Debt/Equity Ratio"
]

# Melt to long format for Altair
long_df = df.melt(
    id_vars=["Rating Score"],
    value_vars=features,
    var_name="Feature",
    value_name="Value"
)

# Outlier clipping function
def clip_outliers(group):
    q_low = group["Value"].quantile(0.1)
    q_high = group["Value"].quantile(0.9)
    return group[(group["Value"] >= q_low) & (group["Value"] <= q_high)]

# Apply clipping and preserve "Feature" as a column
filtered_df = long_df.groupby("Feature", group_keys=False).apply(
    lambda group: clip_outliers(group).assign(Feature=group.name),
    include_groups=False
)

# Altair dropdown setup
dropdown = alt.binding_select(options=features, name="Select Feature:")
selection = alt.selection_point(fields=["Feature"], bind=dropdown, value=features[0])

# Scatterplot and trendline
base = alt.Chart(filtered_df).add_params(selection).transform_filter(selection)

scatter = base.mark_circle(opacity=0.1, size=60).encode(
    x=alt.X("Value:Q", title="Financial Metric Value"),
    y=alt.Y("Rating Score:Q", title="Credit Rating Score (lower is better)", scale=alt.Scale(zero=False, domain=[22, 0])),
    tooltip=["Feature", "Value", "Rating Score"]
)

trend = base.transform_loess("Value", "Rating Score", groupby=["Feature"]).mark_line(color="red", strokeWidth=3).encode(
    x="Value:Q",
    y="Rating Score:Q"
)

chart = (scatter + trend).properties(
    title="Relationship Between Financial Metrics and Credit Rating Score",
    width=800,
    height=500
)

chart = chart.configure_axis(
    labelFontSize=14,
    titleFontSize=16
).configure_title(
    fontSize=18
).configure_legend(
    labelFontSize=14,
    titleFontSize=16
)

output_path = os.path.join(os.path.dirname(__file__), "altair_financial_metric_vs_rating.html")
chart.save(output_path)
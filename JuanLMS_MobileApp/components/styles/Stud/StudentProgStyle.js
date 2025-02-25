import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F5F5",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginLeft: 10,
    },
    card: {
        backgroundColor: "#003366",
        borderRadius: 12,
        padding: 20,
        marginBottom: 40,
        position: "relative",
    },
    cardTitle: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15
    },
    cardCode: {
        color: "white",
        fontSize: 9,
        position: "absolute",
        right: 15,
        top: 15
    },
    cardSubText: {
        color: "white",
        fontSize: 11,
    },
    progressBar: {
        marginTop: 10,
        height: 12,
        borderRadius: 5,
        backgroundColor: "#99CCFF",
    },
    arrowIcon: {
        position: "absolute",
        right: 15,
        top: 30,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 40
    },
    chartContainer: {
        width: "50%",
        backgroundColor: "#003366",
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
    },
    peerAnalysis: {
        width: "45%",
        justifyContent: "center",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "white"
    },
    sectionTitle2: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: "black"
    },
    errorBox: {
        backgroundColor: "#FFCCCC",
        padding: 8,
        borderRadius: 8,
        color: "black",
        fontSize: 12,
    },
    insight: {
        color: "white",
        fontSize: 9,
        textAlign: "right",
        position: "absolute",
        right: 15,
        top: 15
    },
    feedback: {
        color: "white",
        fontSize: 12,
        textAlign: "center",
        marginTop: 5,
        position: "absolute",
        right: 15,
        top: 30
    },
});

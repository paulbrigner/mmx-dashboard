const { app, screen } = require("electron");

app.whenReady().then(() => {
	const displays = screen.getAllDisplays();
	const primaryId = screen.getPrimaryDisplay().id;

	displays.forEach((display, index) => {
		const { x, y, width, height } = display.bounds;
		const marker = display.id === primaryId ? "primary" : "secondary";
		console.log(`${index}: ${marker} id=${display.id} x=${x} y=${y} width=${width} height=${height} scale=${display.scaleFactor}`);
	});

	app.quit();
});

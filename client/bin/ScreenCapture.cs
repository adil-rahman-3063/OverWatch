using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Media;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

public class ScreenCap {
    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [STAThread]
    public static void Main(string[] args) {
        if (args.Length == 0) {
            CaptureScreen(null);
            return;
        }

        string cmd = args[0].ToLowerInvariant();

        if (cmd == "-set" && args.Length > 1) {
            SetClipboard(args[1]);
        } else if (cmd == "-get") {
            GetClipboard();
        } else if (cmd == "-notify") {
            string title = args.Length > 1 ? args[1] : "OverWatch • Image Beamed";
            string sub = args.Length > 2 ? args[2] : "Image copied to Windows Clipboard • Ready to Ctrl+V";
            ShowNotification(title, sub);
        } else if (cmd == "-capture") {
            string outPath = args.Length > 1 ? args[1] : null;
            CaptureScreen(outPath);
        } else {
            CaptureScreen(args[0]);
        }
    }

    static void CaptureScreen(string outPath) {
        try {
            SetProcessDPIAware();
            Rectangle bounds = Screen.PrimaryScreen.Bounds;
            using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height)) {
                using (Graphics g = Graphics.FromImage(bitmap)) {
                    g.CopyFromScreen(bounds.Location, Point.Empty, bounds.Size);
                }

                if (!string.IsNullOrEmpty(outPath)) {
                    string dir = Path.GetDirectoryName(outPath);
                    if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) {
                        Directory.CreateDirectory(dir);
                    }
                    bitmap.Save(outPath, ImageFormat.Png);
                }

                int maxDim = 1280;
                int w = bounds.Width;
                int h = bounds.Height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = (int)((long)h * maxDim / w);
                        w = maxDim;
                    } else {
                        w = (int)((long)w * maxDim / h);
                        h = maxDim;
                    }
                }

                using (Bitmap resized = new Bitmap(w, h)) {
                    using (Graphics rg = Graphics.FromImage(resized)) {
                        rg.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        rg.DrawImage(bitmap, 0, 0, w, h);
                    }

                    using (MemoryStream ms = new MemoryStream()) {
                        ImageCodecInfo encoder = null;
                        foreach (ImageCodecInfo ici in ImageCodecInfo.GetImageEncoders()) {
                            if (ici.MimeType == "image/jpeg") { encoder = ici; break; }
                        }
                        EncoderParameters ep = new EncoderParameters(1);
                        ep.Param[0] = new EncoderParameter(Encoder.Quality, 75L);
                        resized.Save(ms, encoder, ep);
                        Console.Write(Convert.ToBase64String(ms.ToArray()));
                    }
                }
            }
        } catch (Exception ex) {
            Console.Error.Write("ERROR: " + ex.Message);
            Environment.Exit(1);
        }
    }

    static void SetClipboard(string imagePath) {
        for (int retry = 0; retry < 5; retry++) {
            try {
                using (FileStream fs = File.OpenRead(imagePath)) {
                    using (Image img = Image.FromStream(fs)) {
                        Clipboard.SetImage(img);
                        return;
                    }
                }
            } catch (Exception ex) {
                if (retry == 4) {
                    Console.Error.Write("ERROR: " + ex.Message);
                    Environment.Exit(1);
                }
                Thread.Sleep(100);
            }
        }
    }

    static void GetClipboard() {
        for (int retry = 0; retry < 5; retry++) {
            try {
                if (!Clipboard.ContainsImage()) {
                    Console.Write("NO_IMAGE");
                    return;
                }

                using (Image img = Clipboard.GetImage()) {
                    if (img == null) {
                        Console.Write("NO_IMAGE");
                        return;
                    }

                    int maxDim = 1280;
                    int w = img.Width;
                    int h = img.Height;
                    if (w > maxDim || h > maxDim) {
                        if (w > h) {
                            h = (int)((long)h * maxDim / w);
                            w = maxDim;
                        } else {
                            w = (int)((long)w * maxDim / h);
                            h = maxDim;
                        }
                    }

                    using (Bitmap resized = new Bitmap(w, h)) {
                        using (Graphics rg = Graphics.FromImage(resized)) {
                            rg.InterpolationMode = InterpolationMode.HighQualityBicubic;
                            rg.DrawImage(img, 0, 0, w, h);
                        }

                        using (MemoryStream ms = new MemoryStream()) {
                            ImageCodecInfo encoder = null;
                            foreach (ImageCodecInfo ici in ImageCodecInfo.GetImageEncoders()) {
                                if (ici.MimeType == "image/jpeg") { encoder = ici; break; }
                            }
                            EncoderParameters ep = new EncoderParameters(1);
                            ep.Param[0] = new EncoderParameter(Encoder.Quality, 80L);
                            resized.Save(ms, encoder, ep);
                            Console.Write(Convert.ToBase64String(ms.ToArray()));
                            return;
                        }
                    }
                }
            } catch (ExternalException) {
                Thread.Sleep(100);
            } catch {
                if (retry == 4) {
                    Console.Write("NO_IMAGE");
                    return;
                }
                Thread.Sleep(100);
            }
        }
        Console.Write("NO_IMAGE");
    }

    static void ShowNotification(string titleText, string subText) {
        try {
            try { SystemSounds.Asterisk.Play(); } catch {}
            using (Form form = new Form()) {
                form.Text = "OverWatch";
                form.FormBorderStyle = FormBorderStyle.None;
                form.StartPosition = FormStartPosition.Manual;
                form.TopMost = true;
                form.ShowInTaskbar = false;
                form.BackColor = Color.FromArgb(18, 18, 22);
                form.Size = new Size(320, 72);

                Rectangle screen = Screen.PrimaryScreen.WorkingArea;
                form.Location = new Point(screen.Right - 336, screen.Bottom - 88);

                Label title = new Label();
                title.Text = titleText;
                title.ForeColor = Color.FromArgb(20, 241, 149);
                title.Font = new Font("Segoe UI", 10, FontStyle.Bold);
                title.Location = new Point(16, 12);
                title.Size = new Size(288, 20);
                form.Controls.Add(title);

                Label sub = new Label();
                sub.Text = subText;
                sub.ForeColor = Color.FromArgb(200, 200, 200);
                sub.Font = new Font("Segoe UI", 8.5f);
                sub.Location = new Point(16, 36);
                sub.Size = new Size(288, 24);
                form.Controls.Add(sub);

                form.Show();
                for (int i = 0; i < 30; i++) {
                    Application.DoEvents();
                    Thread.Sleep(100);
                }
            }
        } catch {}
    }
}

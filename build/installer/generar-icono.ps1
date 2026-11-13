Add-Type -AssemblyName System.Drawing

$salida = Join-Path (Get-Location) "build/installer/icon.ico"
$tamanos = @(256, 48, 32, 16)
$imagenes = [System.Collections.Generic.List[byte[]]]::new()

foreach ($tamano in $tamanos) {
  $bitmap = [System.Drawing.Bitmap]::new($tamano, $tamano, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $grafico = [System.Drawing.Graphics]::FromImage($bitmap)
  $grafico.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $grafico.Clear([System.Drawing.Color]::Transparent)

  $margen = [Math]::Max(1, $tamano * 0.035)
  $radio = [Math]::Max(2, $tamano * 0.23)
  $camino = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diametro = $radio * 2
  $camino.AddArc($margen, $margen, $diametro, $diametro, 180, 90)
  $camino.AddArc($tamano - $margen - $diametro, $margen, $diametro, $diametro, 270, 90)
  $camino.AddArc($tamano - $margen - $diametro, $tamano - $margen - $diametro, $diametro, $diametro, 0, 90)
  $camino.AddArc($margen, $tamano - $margen - $diametro, $diametro, $diametro, 90, 90)
  $camino.CloseFigure()
  $fondo = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Rectangle]::new(0, 0, $tamano, $tamano),
    [System.Drawing.Color]::FromArgb(255, 34, 27, 67),
    [System.Drawing.Color]::FromArgb(255, 9, 17, 35),
    45
  )
  $grafico.FillPath($fondo, $camino)

  $pizza = $tamano * 0.67
  $px = ($tamano - $pizza) / 2
  $py = ($tamano - $pizza) / 2
  $grafico.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 207, 111, 42)), $px, $py, $pizza, $pizza)
  $borde = $tamano * 0.045
  $grafico.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 204, 99)), $px + $borde, $py + $borde, $pizza - 2 * $borde, $pizza - 2 * $borde)

  $pepperoni = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 190, 55, 48))
  $puntos = @(@(0.37, 0.35), @(0.57, 0.39), @(0.45, 0.55), @(0.62, 0.58))
  foreach ($punto in $puntos) {
    $d = $tamano * 0.12
    $grafico.FillEllipse($pepperoni, $tamano * $punto[0] - $d / 2, $tamano * $punto[1] - $d / 2, $d, $d)
  }
  $albahaca = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 42, 123, 76))
  $hoja = [System.Drawing.RectangleF]::new($tamano * 0.32, $tamano * 0.52, $tamano * 0.15, $tamano * 0.075)
  $grafico.FillEllipse($albahaca, $hoja)
  $hoja2 = [System.Drawing.RectangleF]::new($tamano * 0.51, $tamano * 0.29, $tamano * 0.13, $tamano * 0.065)
  $grafico.FillEllipse($albahaca, $hoja2)

  $stream = [System.IO.MemoryStream]::new()
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $imagenes.Add($stream.ToArray())
  $stream.Dispose()
  $grafico.Dispose()
  $bitmap.Dispose()
  $fondo.Dispose()
  $camino.Dispose()
  $pepperoni.Dispose()
  $albahaca.Dispose()
}

$salidaStream = [System.IO.MemoryStream]::new()
$escritor = [System.IO.BinaryWriter]::new($salidaStream)
$escritor.Write([UInt16]0)
$escritor.Write([UInt16]1)
$escritor.Write([UInt16]$tamanos.Count)
$desplazamiento = 6 + 16 * $tamanos.Count
for ($i = 0; $i -lt $tamanos.Count; $i++) {
  $dimension = if ($tamanos[$i] -eq 256) { [byte]0 } else { [byte]$tamanos[$i] }
  $escritor.Write($dimension)
  $escritor.Write($dimension)
  $escritor.Write([byte]0)
  $escritor.Write([byte]0)
  $escritor.Write([UInt16]1)
  $escritor.Write([UInt16]32)
  $escritor.Write([UInt32]$imagenes[$i].Length)
  $escritor.Write([UInt32]$desplazamiento)
  $desplazamiento += $imagenes[$i].Length
}
foreach ($imagen in $imagenes) { $escritor.Write($imagen) }
[System.IO.Directory]::CreateDirectory((Split-Path $salida -Parent)) | Out-Null
[System.IO.File]::WriteAllBytes($salida, $salidaStream.ToArray())
$escritor.Dispose()
$salidaStream.Dispose()
Write-Output "Icono generado: $salida"

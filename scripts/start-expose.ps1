$ErrorActionPreference = 'Stop'

$RepairOnly = $args.Count -gt 0 -and $args[0] -eq '--repair-only'
$HostName = if ($args.Count -gt 0 -and !$RepairOnly) { $args[0] } else { 'clinicqrv2.test' }
$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$ViteHotFile = Join-Path $ProjectRoot 'public\hot'
$ViteManifest = Join-Path $ProjectRoot 'public\build\manifest.json'
$UserProfilePath = [Environment]::GetFolderPath('UserProfile')
$HerdBin = Join-Path $UserProfilePath '.config\herd\bin'
$HerdExposeBat = Join-Path $HerdBin 'expose.bat'
$HerdExposePhar = Join-Path $HerdBin 'expose.phar'
$HerdExposePharBackup = Join-Path $HerdBin 'expose.phar.clinicqr-original'
$HerdExposeBatBackup = Join-Path $HerdBin 'expose.bat.clinicqr-original'
$PatchedRoot = Join-Path $HerdBin 'expose-patched'
$PatchedEntrypoint = Join-Path $PatchedRoot 'expose'
$PatchedFactory = Join-Path $PatchedRoot 'app\Factory.php'
$PatchedReactDnsConfig = Join-Path $PatchedRoot 'vendor\react\dns\src\Config\Config.php'

function Assert-PathInsideHerdBin {
    param([string] $Path)

    $root = (Resolve-Path -LiteralPath $HerdBin).Path
    $full = if (Test-Path -LiteralPath $Path) {
        (Resolve-Path -LiteralPath $Path).Path
    } else {
        [IO.Path]::GetFullPath($Path)
    }

    if (!$full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to modify path outside Herd bin: $full"
    }
}

function Get-SourcePhar {
    if (Test-Path -LiteralPath $HerdExposePharBackup) {
        return $HerdExposePharBackup
    }

    if (!(Test-Path -LiteralPath $HerdExposePhar)) {
        throw "Could not find Herd Expose PHAR at $HerdExposePhar."
    }

    $head = Get-Content -LiteralPath $HerdExposePhar -TotalCount 1 -ErrorAction SilentlyContinue
    if ($head -match '^<\?php$') {
        throw "Herd expose.phar is already a ClinicQR proxy and no original backup exists at $HerdExposePharBackup."
    }

    Copy-Item -LiteralPath $HerdExposePhar -Destination $HerdExposePharBackup -Force
    return $HerdExposePharBackup
}

function Extract-ExposePhar {
    $sourcePhar = Get-SourcePhar

    if (Test-Path -LiteralPath $PatchedRoot) {
        Assert-PathInsideHerdBin $PatchedRoot
        Remove-Item -Recurse -Force -LiteralPath $PatchedRoot
    }

    New-Item -ItemType Directory -Force -Path $PatchedRoot | Out-Null

    $extractScript = Join-Path ([IO.Path]::GetTempPath()) 'clinicqr-extract-herd-expose.php'
    $php = @'
<?php
$phar = new Phar(getenv('CLINICQR_EXPOSE_PHAR'));
$phar->extractTo(getenv('CLINICQR_EXPOSE_DEST'), null, true);
'@

    Set-Content -LiteralPath $extractScript -Value $php -NoNewline -Encoding ASCII
    $env:CLINICQR_EXPOSE_PHAR = $sourcePhar
    $env:CLINICQR_EXPOSE_DEST = $PatchedRoot
    php $extractScript

    if (!(Test-Path -LiteralPath $PatchedFactory)) {
        throw "Expose PHAR extraction did not create $PatchedFactory."
    }
}

function Patch-ExposeFactory {
    $content = Get-Content -LiteralPath $PatchedFactory -Raw

    $content = $content -replace "use Illuminate\\Support\\Facades\\Artisan;\r?\n", ''

    if ($content -notmatch "use Illuminate\\Database\\Schema\\Blueprint;") {
        $content = $content -replace "use Expose\\Client\\Http\\Controllers\\ReplayModifiedLogController;\r?\n", "use Expose\Client\Http\Controllers\ReplayModifiedLogController;`r`nuse Illuminate\Database\Schema\Blueprint;`r`n"
    }

    if ($content -notmatch "use Illuminate\\Support\\Facades\\Schema;") {
        $content = $content -replace "use Illuminate\\Support\\Facades\\File;\r?\n", "use Illuminate\Support\Facades\File;`r`nuse Illuminate\Support\Facades\Schema;`r`n"
    }

    $replacement = @'
        if (! Schema::hasTable('request_logs')) {
            Schema::create('request_logs', function (Blueprint $table) {
                $table->string('request_id')->primary();
                $table->string('subdomain')->nullable();
                $table->longText('raw_request');
                $table->string('request_method');
                $table->string('request_uri');
                $table->integer('start_time');
                $table->integer('stop_time')->nullable();
                $table->dateTime('performed_at');
                $table->integer('duration');
                $table->json('plugin_data')->nullable();
            });
        }

        if (! Schema::hasTable('response_logs')) {
            Schema::create('response_logs', function (Blueprint $table) {
                $table->id();
                $table->string('request_id');
                $table->integer('status_code');
                $table->binary('raw_response')->nullable();

                $table->foreign('request_id')
                    ->references('request_id')
                    ->on('request_logs')
                    ->onDelete('cascade');
            });
        }
'@

    $patterns = @(
        "        Artisan::call\('migrate', \[\r?\n            '--database' => 'sqlite',\r?\n            '--force' => true, // necessary flag to run in PHAR\r?\n            '--path' => realpath\(__DIR__ \. '/../database/migrations/'\),\r?\n            '--realpath' => true,\r?\n        \]\);",
        "        Artisan::call\('migrate', \[\r?\n            '--force' => true, // necessary flag to run in PHAR\r?\n            '--path' => realpath\(__DIR__ \. '/../database/migrations/'\),\r?\n            '--realpath' => true,\r?\n        \]\);"
    )

    foreach ($pattern in $patterns) {
        $content = [regex]::Replace($content, $pattern, $replacement)
    }

    Set-Content -LiteralPath $PatchedFactory -Value $content -NoNewline -Encoding ASCII

    $updated = Get-Content -LiteralPath $PatchedFactory -Raw
    if ($updated -match "--database|Artisan::call\('migrate'") {
        throw "Expose Factory patch failed; broken migrate call is still present."
    }
}

function Patch-ExposeDns {
    if (!(Test-Path -LiteralPath $PatchedReactDnsConfig)) {
        return
    }

    $content = Get-Content -LiteralPath $PatchedReactDnsConfig -Raw

    if ($content -notmatch "ClinicQR patch: force stable public DNS") {
        $content = $content -replace [regex]::Escape("        // Use WMIC output on Windows`r`n        if (DIRECTORY_SEPARATOR === '\\') {`r`n            return self::loadWmicBlocking();`r`n        }"), @'
        // Use WMIC output on Windows
        if (DIRECTORY_SEPARATOR === '\\') {
            // ClinicQR patch: force stable public DNS for Expose tunnel control traffic.
            $config = new self();
            $config->nameservers = array('1.1.1.1', '8.8.8.8');

            return $config;
        }
'@
    }

    if ($content -notmatch "ClinicQR patch: Windows images without WMIC") {
        $content = $content -replace [regex]::Escape('        $contents = shell_exec($command === null ? ''wmic NICCONFIG get "DNSServerSearchOrder" /format:CSV'' : $command);'), @'
        // ClinicQR patch: Windows images without WMIC should not fail before Expose starts.
        if ($command === null && DIRECTORY_SEPARATOR === '\\' && ! file_exists(getenv('SystemRoot') . '\\System32\\wbem\\WMIC.exe')) {
            $config = new self();
            $config->nameservers = array('1.1.1.1', '8.8.8.8');

            return $config;
        }

        $contents = shell_exec($command === null ? 'wmic NICCONFIG get "DNSServerSearchOrder" /format:CSV' : $command);
'@
    }

    Set-Content -LiteralPath $PatchedReactDnsConfig -Value $content -NoNewline -Encoding ASCII
}

function Patch-HerdLaunchers {
    if (!(Test-Path -LiteralPath $HerdExposeBatBackup) -and (Test-Path -LiteralPath $HerdExposeBat)) {
        Copy-Item -LiteralPath $HerdExposeBat -Destination $HerdExposeBatBackup -Force
    }

    $bat = @'
@ECHO OFF
SETLOCAL
SET "DIR=%~dp0"
SET "PATCHED=%DIR%expose-patched\expose"

IF /I "%~1"=="self-update" (
    ECHO Expose self-update is disabled for this patched Herd launcher.
    ECHO Restore expose.phar.clinicqr-original first if you really need to update Expose.
    EXIT /B 0
)

IF EXIST "%PATCHED%" (
    php "%PATCHED%" %*
    EXIT /B %ERRORLEVEL%
)

ECHO Patched Expose entrypoint was not found: %PATCHED%
EXIT /B 1
'@
    Set-Content -LiteralPath $HerdExposeBat -Value $bat -Encoding ASCII

    $proxy = @'
<?php
$patched = __DIR__ . '/expose-patched/expose';
if (! file_exists($patched)) {
    fwrite(STDERR, "Patched Expose entrypoint missing: {$patched}\n");
    exit(1);
}
require $patched;
'@
    Set-Content -LiteralPath $HerdExposePhar -Value $proxy -NoNewline -Encoding ASCII
}

function Ensure-HerdExposePatched {
    if (!(Test-Path -LiteralPath $HerdBin)) {
        throw "Herd bin folder not found: $HerdBin"
    }

    $needsExtract = !(Test-Path -LiteralPath $PatchedEntrypoint) -or
        !(Test-Path -LiteralPath $PatchedFactory) -or
        ((Get-Content -LiteralPath $PatchedFactory -Raw -ErrorAction SilentlyContinue) -match "--database|Artisan::call\('migrate'")

    if ($needsExtract) {
        Extract-ExposePhar
    }

    Patch-ExposeFactory
    Patch-ExposeDns
    Patch-HerdLaunchers

    php -l $PatchedFactory | Out-Null
    if (Test-Path -LiteralPath $PatchedReactDnsConfig) {
        php -l $PatchedReactDnsConfig | Out-Null
    }
}

Ensure-HerdExposePatched

if ($RepairOnly) {
    Write-Host "Herd Expose patch verified."
    exit 0
}

if (Test-Path -LiteralPath $ViteHotFile) {
    Remove-Item -LiteralPath $ViteHotFile -Force
    Write-Host "Removed Vite hot file so the public Expose URL uses built assets."
}

if (!(Test-Path -LiteralPath $ViteManifest)) {
    Write-Host "Vite build manifest not found. Building frontend assets before exposing ..."
    Push-Location $ProjectRoot
    npm run build
    Pop-Location
}

Write-Host "Herd Expose patch verified. Starting Expose for $HostName ..."
Write-Host "Keep this terminal open while using the public URL."
& $HerdExposeBat $HostName

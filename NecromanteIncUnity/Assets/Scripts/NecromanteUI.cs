using System;
using System.Collections.Generic;
using System.Globalization;
using UnityEngine;
using UnityEngine.UIElements;

namespace NecromanteInc
{
    public sealed class NecromanteUI : MonoBehaviour
    {
        private const string SaveKey = "necromante-inc.unity.v1";
        private const string MusicVolumeKey = "necromante-inc.music-volume";
        private const float MenuArtWidth = 1536f;
        private const float MenuArtHeight = 1024f;
        private static readonly CultureInfo Locale = CultureInfo.GetCultureInfo("pt-BR");
        private static readonly string[] Suffixes = { "qua", "qui", "sex", "sep", "oct", "non", "dec" };
        private static readonly string[] Tabs = { "Monstros", "Estações", "Loja" };
        private static readonly Vector2[] Hotspots =
        {
            new(34, 91), // Cemitério
            new(24, 60), // Cripta
            new(82, 61), // Acampamento
            new(57, 45), // Forja
            new(28, 34), // Torre
            new(67, 78)  // Portal
        };

        private readonly List<Action> bindings = new();
        private Game game;
        private VisualElement root, world;
        private AudioClip conjureSound;
        private Texture2D menuArt, worldArt;
        private PanelSettings panel;
        private AudioSource audioSource, musicSource;
        private float musicVolume;
        private bool playing, stationSelected, confirmReset, confirmPrestige, detailsCollapsed;
        private int tab, selection;
        private string modal;
        private double offlineSeconds;
        private Production offlineGain, rates;
        private double lastTick, lastSave;
        private GameState State => game.State;

        private void Start()
        {
            Catalog catalog = JsonUtility.FromJson<Catalog>(Resources.Load<TextAsset>("Catalog").text);
            GameState saved = null;
            try
            {
                if (PlayerPrefs.HasKey(SaveKey))
                    saved = JsonUtility.FromJson<GameState>(PlayerPrefs.GetString(SaveKey));
            }
            catch (ArgumentException)
            {
                Debug.LogWarning("O progresso salvo de Necromante Inc. não pôde ser lido.");
            }

            game = new Game(catalog, saved);
            if (saved != null && saved.lastSeen > 0)
            {
                double seconds = Math.Min(43_200, (Now() - saved.lastSeen) / 1000.0);
                if (seconds > 60)
                {
                    offlineSeconds = seconds;
                    offlineGain = game.Advance(seconds);
                    Save();
                }
            }

            panel = ScriptableObject.CreateInstance<PanelSettings>();
            panel.themeStyleSheet = Resources.Load<ThemeStyleSheet>("DefaultRuntimeTheme");
            panel.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            panel.referenceResolution = new Vector2Int(1366, 768);
            panel.screenMatchMode = PanelScreenMatchMode.MatchWidthOrHeight;
            panel.match = 0.5f;
            UIDocument document = gameObject.AddComponent<UIDocument>();
            document.panelSettings = panel;
            root = document.rootVisualElement;
            root.AddToClassList("necromante");
            root.styleSheets.Add(Resources.Load<StyleSheet>("GameTheme"));
            root.RegisterCallback<GeometryChangedEvent>(AdaptLayout);
            menuArt = Resources.Load<Texture2D>("menu-bg");
            worldArt = Resources.Load<Texture2D>("world-ground");
            Camera camera = gameObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.05f, 0.08f, 0.1f);
            gameObject.AddComponent<AudioListener>();
            audioSource = gameObject.AddComponent<AudioSource>();
            audioSource.playOnAwake = false;
            musicVolume = Mathf.Clamp01(PlayerPrefs.GetFloat(MusicVolumeKey, 0.18f));
            musicSource = gameObject.AddComponent<AudioSource>();
            musicSource.playOnAwake = false;
            musicSource.loop = true;
            musicSource.spatialBlend = 0;
            musicSource.volume = 0;
            musicSource.clip = Resources.Load<AudioClip>("Audio/relogio-de-areia");
            conjureSound = CreateConjureSound();
            lastTick = lastSave = Time.realtimeSinceStartupAsDouble;
            Draw();
        }

        private void Update()
        {
            if (game == null) return;
            UpdateMusic();
            double now = Time.realtimeSinceStartupAsDouble;
            if (now - lastTick >= 0.1)
            {
                game.Advance(Math.Min(5, now - lastTick));
                lastTick = now;
                Refresh();
            }
            if (now - lastSave >= 5)
            {
                Save();
                lastSave = now;
            }
        }

        private static long Now() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        private void UpdateMusic()
        {
            if (musicSource.clip == null) return;
            bool audible = playing && State.sound && musicVolume > 0;
            if (audible && !musicSource.isPlaying) musicSource.Play();

            float target = audible ? musicVolume : 0;
            musicSource.volume = Mathf.Lerp(musicSource.volume, target, 1 - Mathf.Exp(-4 * Time.unscaledDeltaTime));
            if (!audible && musicSource.isPlaying && musicSource.volume < 0.001f)
                musicSource.Stop();
        }

        private void Save()
        {
            if (game == null) return;
            State.lastSeen = Now();
            PlayerPrefs.SetString(SaveKey, JsonUtility.ToJson(State));
            PlayerPrefs.Save();
        }

        private void OnApplicationPause(bool paused)
        {
            if (paused) Save();
        }

        private void OnApplicationQuit() => Save();

        private void OnDestroy()
        {
            Save();
            if (conjureSound != null) Destroy(conjureSound);
            if (panel != null) Destroy(panel);
        }

        private void AdaptLayout(GeometryChangedEvent evt) =>
            root.EnableInClassList("compact", evt.newRect.width < 1080);

        private void Draw()
        {
            root.Clear();
            bindings.Clear();
            world = null;
            if (playing) DrawGame();
            else DrawMenu();
            if (modal != null) DrawModal();
            Refresh();
        }

        private void Refresh()
        {
            rates = game.Rates();
            foreach (Action refresh in bindings) refresh();
        }

        private void DrawMenu()
        {
            VisualElement menu = Box(root, "menu-screen");
            VisualElement art = Box(menu, "menu-art");
            art.style.backgroundImage = new StyleBackground(menuArt);
            menu.RegisterCallback<GeometryChangedEvent>(evt =>
            {
                float scale = Mathf.Min(evt.newRect.width / MenuArtWidth, evt.newRect.height / MenuArtHeight);
                art.style.width = MenuArtWidth * scale;
                art.style.height = MenuArtHeight * scale;
            });

            MenuButton(art, "Jogar", 368, () => { playing = true; Draw(); });
            MenuButton(art, "Configurações", 455, () => Open("Configurações"));
            MenuButton(art, "Conquistas", 541, () => Open("Conquistas"));
            MenuButton(art, "Créditos", 628, () => Open("Créditos"));
            MenuButton(art, "Sair", 714, () => Open("Sair"));

            MenuAmount(art, "Ouro", 1273, () => State.gold);
            MenuAmount(art, "Ossos", 1380, () => State.bones);
            MenuAmount(art, "Essência", 1475, () => State.essence);
        }

        private void MenuButton(VisualElement art, string text, float y, Action action)
        {
            Button button = Button(art, text, action, "menu-hotspot");
            PlaceOnMenuArt(button, new Rect(1104, y, 351, 69));
        }

        private void MenuAmount(VisualElement art, string resource, float x, Func<double> amount)
        {
            Label label = Label(art, "", "menu-amount");
            PlaceOnMenuArt(label, new Rect(x, 936, 60, 34));

            void UpdateAmount()
            {
                string value = N(amount());
                label.text = value;
                label.tooltip = $"{resource} · {value}";
                float width = art.layout.width;
                if (width > 0)
                    label.style.fontSize = Mathf.Min(21f, 105f / value.Length) * width / MenuArtWidth;
            }

            bindings.Add(UpdateAmount);
            art.RegisterCallback<GeometryChangedEvent>(_ => UpdateAmount());
        }

        private static void PlaceOnMenuArt(VisualElement element, Rect pixels)
        {
            element.style.left = Length.Percent(100f * pixels.x / MenuArtWidth);
            element.style.top = Length.Percent(100f * pixels.y / MenuArtHeight);
            element.style.width = Length.Percent(100f * pixels.width / MenuArtWidth);
            element.style.height = Length.Percent(100f * pixels.height / MenuArtHeight);
        }

        private void DrawGame()
        {
            VisualElement header = Box(root, "header");
            VisualElement brand = Box(header, "brand");
            Label(brand, "Necromante Inc.", "heading");
            VisualElement level = Box(brand, "header-level");
            LiveLabel(level, () => $"Nível {State.level}", "muted");
            VisualElement xpBar = Box(level, "xp-bar");
            VisualElement xpFill = Box(xpBar, "xp-fill");
            LiveLabel(xpBar, () => $"{N(State.xp)}/{N(Game.XpNeeded(State.level))} XP", "xp-value");
            bindings.Add(() => xpFill.style.width = Length.Percent(
                100f * Mathf.Clamp01((float)(State.xp / Game.XpNeeded(State.level)))));

            DrawObjective(header);
            VisualElement wallet = Box(header, "wallet");
            ResourceBalance(wallet, "gold", () => $"Ouro\n{N(State.gold)}  (+{N(rates.gold)}/s)", "gold");
            ResourceBalance(wallet, "bones", () => $"Ossos\n{N(State.bones)}  (+{N(rates.bones)}/s)", "bone");
            ResourceBalance(wallet, "essence", () => $"Essência\n{N(State.essence)}  (+{N(rates.essence)}/s)", "essence");
            ResourceBalance(wallet, "eternal-souls", () => $"Almas Eternas\n{N(State.eternalSouls)}  (+{N(State.eternalSouls * (Game.SoulBonus * 100))}%)", "souls");
            VisualElement actions = Box(header, "header-actions");
            Button(actions, "Prestígio", () => Open("Prestígio"));
            Button(actions, "Conquistas", () => Open("Conquistas"));
            Button(actions, "Missões", () => Open("Missões"));
            Button(actions, "Configurações", () => Open("Configurações"));
            Button(actions, "Menu", () => { Save(); playing = false; Draw(); });

            VisualElement board = Box(root, "board");
            DrawShop(board);
            DrawWorld(board);
            DrawDetails(board);

            VisualElement footer = Box(root, "footer");
            Label(footer, "VALE DOS OSSOS", "eyebrow");
        }

        private void DrawObjective(VisualElement header)
        {
            VisualElement objectiveCard = Box(header, "objective");
            Label(objectiveCard, "OBJETIVO ATUAL", "eyebrow");
            LiveLabel(objectiveCard, () =>
            {
                int index = State.objectiveIndex;
                if (index >= game.Data.objectives.Length) return "Todos os objetivos concluídos";
                Objective objective = game.Data.objectives[index];
                return $"{objective.text}\n{Math.Min(game.Progress(objective), objective.target)}/{objective.target}  •  +{N(objective.reward)} ouro";
            }, "copy");
        }

        private void DrawShop(VisualElement board)
        {
            VisualElement shop = Box(board, "side", "shop");
            VisualElement tabs = Box(shop, "tabs");
            for (int i = 0; i < Tabs.Length; i++)
            {
                int next = i;
                Button(tabs, Tabs[i], () => { tab = next; Draw(); }, i == tab ? "active" : null);
            }
            VisualElement list = Scroll(shop);
            if (tab == 0)
            {
                for (int i = 0; i < game.Data.units.Length; i++)
                {
                    int index = i;
                    Unit unit = game.Data.units[i];
                    VisualElement row = Box(list, "card");
                    Button pick = Button(row, unit.name, () => Select(index, false),
                        !stationSelected && selection == index ? "active" : "pick");
                    pick.AddToClassList("monster-pick");
                    MonsterIcon(pick, unit);
                    LiveLabel(row, () => $"{State.units[index]} em posse  •  +{N(game.PerUnit(index))} {Resource(unit.produces)}/s cada", "muted");
                    LiveButton(row, () => $"Comprar · {N(game.UnitCost(index))} ossos",
                        () => State.bones >= game.UnitCost(index), () => game.BuyUnit(index, false));
                }
            }
            else if (tab == 1)
            {
                Label(list, "Estações do vale", "eyebrow");
                for (int i = 0; i < game.Data.stations.Length; i++)
                {
                    int index = i;
                    Station station = game.Data.stations[i];
                    if (i > 0 && station.group != game.Data.stations[i - 1].group)
                        Label(list, "Outros locais", "eyebrow");
                    VisualElement row = Box(list, "card");
                    Button pick = Button(row, station.name, () => Select(index, true),
                        stationSelected && selection == index ? "active" : "pick");
                    pick.AddToClassList("monster-pick");
                    StationArt(pick, index);
                    LiveLabel(row, () => $"{StationFormName(index)}  •  Nv {State.stations[index]}", "muted");
                    LiveLabel(row, () => $"{game.StationForm(index)}/2 evoluções  •  {station.role}", "muted");
                    LiveButton(row, () => $"Melhorar · {N(game.StationCost(index))} ouro",
                        () => State.gold >= game.StationCost(index), () => game.BuyStation(index));
                    Button(row, "Ver aprimoramentos", () => Select(index, true));
                }
            }
            else
            {
                LiveLabel(list, () => $"{N(game.AutoClicks)} conjurações/s  •  +{N(game.AutoClicks * game.ClickPower)} ossos/s", "gold");
                for (int i = 0; i < game.Data.automation.Length; i++)
                {
                    int index = i;
                    Automation item = game.Data.automation[i];
                    VisualElement row = Box(list, "card");
                    Label(row, item.name, "subheading");
                    Label(row, item.description, "copy");
                    LiveLabel(row, () => $"{State.automation[index]} em posse  •  +{N(item.clicksPerSecond)}/s cada", "muted");
                    LiveButton(row, () => $"Comprar · {N(game.AutomationCost(index))} essência",
                        () => State.essence >= game.AutomationCost(index), () => game.BuyAutomation(index));
                }
            }
        }

        private void DrawWorld(VisualElement board)
        {
            world = Box(board, "world");
            VisualElement map = Box(world, "world-map");
            map.style.backgroundImage = new StyleBackground(worldArt);
            world.RegisterCallback<GeometryChangedEvent>(evt =>
            {
                // Mantém os pontos das estruturas presos às mesmas clareiras em qualquer janela.
                float availableHeight = Mathf.Max(0, evt.newRect.height - 62);
                map.style.width = evt.newRect.width;
                map.style.height = availableHeight;
            });
            for (int i = 0; i < Hotspots.Length; i++)
            {
                int index = i;
                Station station = game.Data.stations[i];
                var marker = Button(map, "", () =>
                {
                    Select(index, true);
                    if (index == 0) Conjure();
                }, "station-marker");
                marker.tooltip = station.description;
                marker.style.left = Length.Percent(Hotspots[i].x);
                marker.style.top = Length.Percent(Hotspots[i].y);
                marker.EnableInClassList("active", stationSelected && selection == index);
                StationArt(marker, index);
                LiveLabel(marker, () => $"{station.name}\n{StationFormName(index)} · Nv {State.stations[index]}", "station-map-label");
            }
            LiveButton(world, () => $"Conjurar   +{N(game.ClickPower)} ossos", () => true, Conjure, "conjure");
            if (offlineSeconds > 0)
            {
                VisualElement notice = Box(world, "offline");
                Label(notice, "Seu exército trabalhou sozinho", "subheading");
                int minutes = (int)Math.Round(offlineSeconds / 60);
                Label(notice, $"Offline por {minutes / 60}h {minutes % 60}m", "muted");
                Label(notice, $"+{N(offlineGain.gold)} ouro  •  +{N(offlineGain.bones)} ossos\n+{N(offlineGain.essence)} essência", "copy");
                Button(notice, "Recolher", () => { offlineSeconds = 0; Draw(); }, "primary");
            }
        }

        private void Conjure()
        {
            double gain = game.ClickPower;
            if (State.sound) audioSource.PlayOneShot(conjureSound);
            game.Conjure();
            VisualElement pop = Label(world, $"+{N(gain)} ossos", "pop");
            pop.pickingMode = PickingMode.Ignore;
            pop.schedule.Execute(pop.RemoveFromHierarchy).StartingIn(650);
            Refresh();
        }

        private void Select(int index, bool station)
        {
            if (selection == index && stationSelected == station) return;
            selection = index;
            stationSelected = station;
            Draw();
        }

        private void DrawDetails(VisualElement board)
        {
            VisualElement viewport = Box(board, "details");
            VisualElement panel = Box(viewport, "side", "details-content");
            Button toggle = Button(viewport, "", () => detailsCollapsed = !detailsCollapsed, "details-toggle");
            void UpdateVisibility()
            {
                viewport.EnableInClassList("details-collapsed", detailsCollapsed);
                panel.SetEnabled(!detailsCollapsed);
                toggle.text = detailsCollapsed ? "‹" : "›";
                toggle.tooltip = detailsCollapsed ? "Mostrar detalhes" : "Recolher detalhes";
            }
            bindings.Add(UpdateVisibility);

            VisualElement detail = Scroll(panel);
            int index = selection;
            if (stationSelected)
            {
                DrawStationDetails(detail, index);
                return;
            }

            Unit unit = game.Data.units[index];
            VisualElement hero = Box(detail, "monster-hero");
            MonsterIcon(hero, unit);
            VisualElement identity = Box(hero, "monster-identity");
            Label(identity, unit.name, "heading");
            Label(identity, unit.role, "eyebrow");
            Label(detail, unit.description, "copy");
            LiveLabel(detail, () =>
            {
                int count = State.units[index];
                double rate = game.PerUnit(index);
                return $"{count} em posse  •  +{N(rate * count)} {Resource(unit.produces)}/s\n+{N(rate)}/s por unidade";
            }, "gold");
            LiveButton(detail, () => $"Comprar 1 · {N(game.UnitCost(index))} ossos",
                () => State.bones >= game.UnitCost(index), () => game.BuyUnit(index, false), "primary");
            LiveButton(detail, () =>
            {
                int max = game.AffordableUnits(index);
                return max > 0 ? $"Comprar Máx. ({max}) · {N(game.UnitCost(index, max))}" : "Comprar Máx.";
            }, () => game.AffordableUnits(index) > 0, () => game.BuyUnit(index, true));

            int target = game.UnitIndex(unit.evolvesTo);
            if (target >= 0)
            {
                Label(detail, "EVOLUÇÃO", "eyebrow");
                Label(detail, "Esqueleto → Zumbi → Cavaleiro Morto", "copy");
                Button(detail, $"Evoluir {unit.evolutionCost} → 1 {game.Data.units[target].name}", () => game.Evolve(index),
                    enabled: () => State.units[index] >= unit.evolutionCost);
            }

            Label(detail, "MELHORIAS", "eyebrow");
            foreach (Upgrade upgrade in unit.upgrades)
            {
                VisualElement card = Box(detail, "card");
                Label(card, upgrade.name, "subheading");
                Label(card, upgrade.description, "copy");
                LiveButton(card, () => game.HasUpgrade(upgrade) ? "Adquirido · ×2 produção" :
                    State.units[index] < upgrade.requirement ? $"Requer {upgrade.requirement} em posse" :
                    $"×2 produção · {N(upgrade.cost)} {Resource(upgrade.currency)}",
                    () => !game.HasUpgrade(upgrade) && State.units[index] >= upgrade.requirement &&
                        State.Balance(upgrade.currency) >= upgrade.cost,
                    () => game.BuyUpgrade(index, upgrade));
            }
        }

        private void Open(string name)
        {
            modal = name;
            confirmReset = false;
            confirmPrestige = false;
            Draw();
        }

        private void DrawModal()
        {
            VisualElement overlay = Box(root, "overlay");
            VisualElement dialog = Box(overlay, "dialog");
            VisualElement heading = Box(dialog, "dialog-heading");
            Label(heading, modal, "heading");
            Button(heading, "Fechar", () => Open(null));
            VisualElement content = Scroll(dialog);
            switch (modal)
            {
                case "Configurações":
                    LiveButton(content, () => State.sound ? "Som: ligado" : "Som: desligado", () => true,
                        () => { State.sound = !State.sound; Save(); });
                    Label musicLabel = Label(content, $"Volume da música · {Mathf.RoundToInt(musicVolume * 100)}%", "subheading");
                    var musicSlider = new Slider(0, 100) { value = musicVolume * 100 };
                    musicSlider.AddToClassList("music-volume");
                    musicSlider.RegisterValueChangedCallback(evt =>
                    {
                        musicVolume = Mathf.Clamp01(evt.newValue / 100);
                        musicLabel.text = $"Volume da música · {Mathf.RoundToInt(musicVolume * 100)}%";
                        PlayerPrefs.SetFloat(MusicVolumeKey, musicVolume);
                        PlayerPrefs.Save();
                    });
                    content.Add(musicSlider);
                    Button(content, "Salvar agora", () =>
                    {
                        Save();
                        Label status = Label(content, "Progresso salvo.", "gold");
                        status.schedule.Execute(status.RemoveFromHierarchy).StartingIn(1800);
                    });
                    if (confirmReset)
                    {
                        Label(content, "Apagar todo o progresso, incluindo as Almas Eternas e os bônus permanentes?", "copy");
                        Button(content, "Apagar progresso", () =>
                        {
                            game = new Game(game.Data);
                            offlineSeconds = 0;
                            Save();
                            Open(null);
                        }, "danger");
                        Button(content, "Cancelar", () => Open("Configurações"));
                    }
                    else
                        Button(content, "Redefinir progresso", () => { confirmReset = true; Draw(); }, "danger");
                    break;
                case "Prestígio":
                    DrawPrestige(content);
                    break;
                case "Conquistas":
                    foreach (Achievement achievement in game.Data.achievements)
                    {
                        VisualElement card = Box(content, "card");
                        LiveLabel(card, () => $"{achievement.name}  •  {(game.Unlocked(achievement) ? "Desbloqueada" : "Bloqueada")}", "subheading");
                        Label(card, achievement.description, "copy");
                    }
                    break;
                case "Missões":
                    for (int i = 0; i < game.Data.objectives.Length; i++)
                    {
                        int index = i;
                        Objective objective = game.Data.objectives[i];
                        VisualElement card = Box(content, "card");
                        Label(card, objective.text, "subheading");
                        LiveLabel(card, () => (index < State.objectiveIndex ? "Concluído" :
                            $"{Math.Min(game.Progress(objective), objective.target)}/{objective.target}") +
                            $"  •  +{N(objective.reward)} ouro", "gold");
                    }
                    break;
                case "Créditos":
                    Label(content, "Necromante Inc. — MecTrap", "subheading");
                    Label(content, "Jogo incremental de cemitério. Conjure ossos, erga criaturas na Cripta e melhore as estações do vale.", "copy");
                    Label(content, "Arte do menu e do mapa reaproveitada da versão original.", "copy");
                    LiveLabel(content, () => $"{Wallet()}\n{State.clicks} conjurações", "gold");
                    break;
                case "Sair":
                    Label(content, "Seu progresso será salvo antes de sair.", "copy");
                    Button(content, "Salvar e sair", () =>
                    {
                        Save();
#if UNITY_EDITOR
                        UnityEditor.EditorApplication.isPlaying = false;
#else
                        Application.Quit();
#endif
                    }, "danger");
                    break;
            }
        }

        private void DrawPrestige(VisualElement content)
        {
            Label(content, "Renascimento do reino", "subheading");
            Label(content, $"Disponível a partir do nível {Game.PrestigeLevel}. Cada Alma Eterna concede +{N(Game.SoulBonus * 100)}% de geração permanente para ouro, ossos, essência e conjurações.", "copy");
            LiveLabel(content, () => $"Almas Eternas  {N(State.eternalSouls)}\nBônus permanente  +{N(State.eternalSouls * (Game.SoulBonus * 100))}%\nRenascimentos  {State.prestigeCount}", "souls");
            LiveLabel(content, () => game.CanPrestige ? "Renascimento disponível" :
                $"Nível {State.level}/{Game.PrestigeLevel} · continue desenvolvendo o reino.", "gold");
            LiveLabel(content, () => $"Ouro produzido neste ciclo  {N(State.totalGold)}\nRecompensa atual  +{N(game.PrestigeGain)} Almas Eternas\n" +
                $"Bônus após renascer  +{N((State.eternalSouls + game.PrestigeGain) * (Game.SoulBonus * 100))}%", "copy");
            Label(content, "Produzir mais ouro e alcançar níveis mais altos aumenta a recompensa. As Almas Eternas se acumulam a cada renascimento.", "muted");
            if (confirmPrestige)
            {
                Label(content, "Confirmar o renascimento? Ouro, ossos, essência, nível, XP, monstros, estações, aprimoramentos, automação e missões deste ciclo voltam ao início. Suas Almas Eternas e configurações de som são preservadas.", "copy");
                LiveButton(content, () => $"Confirmar · +{N(game.PrestigeGain)} Almas Eternas",
                    () => game.CanPrestige, () =>
                    {
                        if (!game.Prestige()) return;
                        offlineSeconds = 0;
                        selection = 0;
                        stationSelected = false;
                        tab = 0;
                        playing = true;
                        Save();
                        Open(null);
                    }, "primary");
                Button(content, "Cancelar", () => Open("Prestígio"));
            }
            else
                LiveButton(content, () => game.CanPrestige ? "Preparar renascimento" : $"Requer nível {Game.PrestigeLevel}",
                    () => game.CanPrestige, () => { confirmPrestige = true; Draw(); }, "primary");
        }

        private string Wallet() => $"{N(State.gold)} ouro  •  {N(State.bones)} ossos  •  {N(State.essence)} essência";
        private static string Resource(string key) => key == "gold" ? "ouro" : key == "bones" ? "ossos" : "essência";

        private string StationBonus(int index, int level)
        {
            Station station = game.Data.stations[index];
            double bonus = (1 + level * station.bonusPerLevel) * game.StationMultiplier(index) - 1;
            return station.effect == "click" ? $"+{N(bonus)} ossos base por conjuração" : $"+{N(bonus * 100)}%";
        }

        private string StationFormName(int index) => game.Data.stations[index].forms[game.StationForm(index)];

        private void StationArt(VisualElement parent, int index)
        {
            var image = new Image
            {
                image = Resources.Load<Texture2D>($"Stations/{game.Data.stations[index].id}"),
                scaleMode = ScaleMode.ScaleToFit,
                pickingMode = PickingMode.Ignore
            };
            image.AddToClassList("station-art");
            parent.Add(image);
            int previousForm = game.StationForm(index);
            void SetForm(int form) => image.uv = new Rect(form / 3f, 0, 1f / 3f, 1);
            SetForm(previousForm);
            bindings.Add(() =>
            {
                int form = game.StationForm(index);
                if (previousForm == form) return;
                previousForm = form;
                SetForm(form);
                image.AddToClassList("station-evolved");
                image.schedule.Execute(() => image.RemoveFromClassList("station-evolved")).StartingIn(350);
            });
        }

        private void DrawStationDetails(VisualElement detail, int index)
        {
            Station station = game.Data.stations[index];
            Label(detail, station.name, "heading");
            StationArt(Box(detail, "station-preview"), index);
            LiveLabel(detail, () => StationFormName(index), "subheading");
            Label(detail, station.description, "copy");
            LiveLabel(detail, () => $"Nível {State.stations[index]}\nBônus atual  {StationBonus(index, State.stations[index])}\n" +
                $"Próximo nível  {StationBonus(index, State.stations[index] + 1)}", "gold");
            LiveButton(detail, () => $"Subir nível · {N(game.StationCost(index))} ouro",
                () => State.gold >= game.StationCost(index), () => game.BuyStation(index));
            LiveLabel(detail, () => $"EVOLUÇÕES  {game.StationForm(index)}/2", "eyebrow");
            Label(detail, "Compre os dois aprimoramentos da etapa em qualquer ordem para liberar a evolução. Escolha livremente qual estação desenvolver.", "copy");

            for (int stage = 0; stage < 2; stage++)
            {
                int currentStage = stage;
                VisualElement section = Box(detail, "station-stage");
                bindings.Add(() => section.style.display = game.StationForm(index) == currentStage ?
                    DisplayStyle.Flex : DisplayStyle.None);
                for (int offset = 0; offset < 3; offset++)
                {
                    int slot = stage * 3 + offset;
                    bool evolution = offset == 2;
                    StationImprovement improvement = station.improvements[slot];
                    VisualElement card = Box(section, "card");
                    Label(card, evolution ? $"EVOLUÇÃO · {improvement.name}" : improvement.name, "subheading");
                    Label(card, improvement.description, "copy");
                    Label(card, $"+{N((improvement.multiplier - 1) * 100)}% {StationEffectLabel(station)}", "gold");
                    LiveLabel(card, () => game.HasStationImprovement(index, slot) ? "Adquirido" :
                        StationImprovementCost(improvement), "muted");
                    if (evolution)
                        LiveLabel(card, () => game.HasStationImprovement(index, slot - 2) &&
                            game.HasStationImprovement(index, slot - 1) ? $"Nova aparência · {station.forms[currentStage + 1]}" :
                            "Requer os dois aprimoramentos acima.", "copy");
                    LiveButton(card, () => game.HasStationImprovement(index, slot) ? "Adquirido" :
                        evolution ? "Evoluir estrutura" : "Comprar aprimoramento",
                        () => game.CanBuyStationImprovement(index, slot),
                        () => { if (game.BuyStationImprovement(index, slot)) Save(); }, evolution ? "primary" : null);
                }
            }
            Label completed = Label(detail, "Todas as evoluções desbloqueadas. Os níveis da estação continuam disponíveis.", "gold");
            bindings.Add(() => completed.style.display = game.StationForm(index) == 2 ? DisplayStyle.Flex : DisplayStyle.None);
        }

        private static string StationImprovementCost(StationImprovement improvement)
        {
            string cost = $"{N(improvement.gold)} ouro · {N(improvement.bones)} ossos";
            return improvement.essence > 0 ? $"{cost} · {N(improvement.essence)} essência" : cost;
        }

        private static string StationEffectLabel(Station station) => station.effect switch
        {
            "gold" => "produção de ouro",
            "bones" => "ganho de ossos",
            "essence" => "produção de essência",
            "click" => "poder da torre",
            _ => "produção geral"
        };

        private static string N(double number)
        {
            if (double.IsInfinity(number)) return "∞";
            if (number < 10) return number.ToString("0.#", Locale);
            if (number < 1e15) return Math.Floor(number).ToString("N0", Locale);
            int tier = Math.Min((int)(Math.Log10(number) / 3), 11);
            double scaled = number / Math.Pow(1000, tier);
            return $"{scaled.ToString(scaled < 10 ? "0.00" : "0.0", Locale)} {Suffixes[tier - 5]}";
        }

        private static VisualElement Box(VisualElement parent, params string[] classes)
        {
            var element = new VisualElement();
            foreach (string style in classes) element.AddToClassList(style);
            parent.Add(element);
            return element;
        }

        private static VisualElement Scroll(VisualElement parent)
        {
            var scroll = new ScrollView();
            scroll.AddToClassList("scroll");
            parent.Add(scroll);
            return scroll.contentContainer;
        }

        private static Label Label(VisualElement parent, string text, string style)
        {
            var label = new Label(text);
            label.AddToClassList(style);
            parent.Add(label);
            return label;
        }

        private static void MonsterIcon(VisualElement parent, Unit unit)
        {
            var icon = new Image
            {
                image = Resources.Load<Texture2D>($"Icons/Monsters/{unit.id}"),
                scaleMode = ScaleMode.ScaleToFit,
                pickingMode = PickingMode.Ignore,
                tooltip = unit.name
            };
            icon.AddToClassList("monster-icon");
            parent.Add(icon);
        }

        private void LiveLabel(VisualElement parent, Func<string> text, string style)
        {
            Label label = Label(parent, "", style);
            bindings.Add(() => label.text = text());
        }

        private void ResourceBalance(VisualElement parent, string resource, Func<string> text, string style)
        {
            VisualElement balance = Box(parent, "resource-balance");
            var icon = new Image
            {
                image = Resources.Load<Texture2D>($"Icons/Resources/{resource}"),
                scaleMode = ScaleMode.ScaleToFit,
                pickingMode = PickingMode.Ignore
            };
            icon.AddToClassList("currency-icon");
            balance.Add(icon);
            LiveLabel(balance, text, style);
        }

        private Button Button(VisualElement parent, string text, Action action, string style = null, Func<bool> enabled = null)
        {
            var button = new Button { text = text };
            IVisualElementScheduledItem clearFlash = null;
            button.clicked += () =>
            {
                action();
                Refresh();

                // Algumas ações recriam a tela e removem o botão pressionado.
                if (button.panel == null) return;

                button.AddToClassList("click-flash");
                clearFlash ??= button.schedule.Execute(() => button.RemoveFromClassList("click-flash"));
                clearFlash.ExecuteLater(90);
            };
            button.AddToClassList("button");
            if (style != null) button.AddToClassList(style);
            if (enabled != null) bindings.Add(() => button.SetEnabled(enabled()));
            parent.Add(button);
            return button;
        }

        private void LiveButton(VisualElement parent, Func<string> text, Func<bool> enabled, Action action, string style = null)
        {
            Button button = Button(parent, "", action, style, enabled);
            bindings.Add(() => button.text = text());
        }

        private static AudioClip CreateConjureSound()
        {
            const int sampleRate = 22050;
            var samples = new float[(int)(0.24 * sampleRate)];
            double phase = 0;
            for (int i = 0; i < samples.Length; i++)
            {
                double time = i / (double)sampleRate;
                double frequency = 340 * Math.Pow(110.0 / 340, Math.Min(time / 0.18, 1));
                phase += frequency / sampleRate;
                double triangle = 1 - 4 * Math.Abs(phase % 1 - 0.5);
                double envelope = 0.07 * Math.Min(time / 0.012, 1) * Math.Exp(-28 * Math.Max(0, time - 0.012));
                samples[i] = (float)(triangle * envelope);
            }
            AudioClip clip = AudioClip.Create("Conjuração", samples.Length, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }
    }
}

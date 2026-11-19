using System;

namespace NecromanteInc
{
    [Serializable]
    public class Catalog
    {
        public Unit[] units;
        public Station[] stations;
        public Automation[] automation;
        public Objective[] objectives;
        public Achievement[] achievements;
    }

    [Serializable]
    public class Unit
    {
        public string id, name, role, description, produces, evolvesTo;
        public double cost, costGrowth, baseRate;
        public int evolutionCost;
        public Upgrade[] upgrades;
    }

    [Serializable]
    public class Upgrade
    {
        public string id, name, description, currency;
        public double cost, multiplier;
        public int requirement;
    }

    [Serializable]
    public class Station
    {
        public string id, name, role, description, effect, group;
        public double baseCost, costGrowth, bonusPerLevel;
        public string[] forms;
        public StationImprovement[] improvements;
    }

    [Serializable]
    public class StationImprovement
    {
        public string name, description;
        public double gold, bones, essence, multiplier;
    }

    [Serializable]
    public class Automation
    {
        public string id, name, description;
        public double cost, costGrowth, clicksPerSecond;
    }

    [Serializable]
    public class Objective
    {
        public string id, text;
        public string metric, subject;
        public bool optional;
        public int target;
        public double reward;
    }

    [Serializable]
    public class Achievement
    {
        public string id, name, description;
        public string metric, subject;
        public double target;
    }

    [Serializable]
    public class GameState
    {
        public double gold, bones, essence, totalGold, xp;
        public int clicks, purchases, objectiveIndex;
        public int level = 1;
        public int[] units, stations, automation, stationImprovements;
        public string[] upgrades;
        public bool sound = true;
        public long lastSeen;
        public double eternalSouls;
        public int prestigeCount;
        public bool endingCompleted;
        public string[] completedObjectives, achievements;
        public int evolutions;

        public double Balance(string resource) => resource == "gold" ? gold : resource == "bones" ? bones : essence;

        public void Add(string resource, double amount)
        {
            switch (resource)
            {
                case "gold": gold += amount; break;
                case "bones": bones += amount; break;
                case "essence": essence += amount; break;
            }
        }
    }

    public struct Production
    {
        public double gold, bones, essence;

        public void Add(string resource, double amount)
        {
            switch (resource)
            {
                case "gold": gold += amount; break;
                case "bones": bones += amount; break;
                case "essence": essence += amount; break;
            }
        }
    }

    public sealed class Game
    {
        public const int PrestigeLevel = 10;
        public const int LordPartCount = 5;
        public static readonly string[] LordParts =
            { "Crânio Coroado", "Tórax Ancestral", "Braços do Conquistador", "Pernas do Soberano", "Alma das Trevas" };
        public const double SoulBonus = 0.10;
        public readonly Catalog Data;
        public GameState State { get; private set; }

        public Game(Catalog data, GameState saved = null)
        {
            Data = data;
            State = saved ?? new GameState();
            State.level = Math.Max(1, State.level);
            State.objectiveIndex = Math.Max(0, Math.Min(MainObjectiveCount, State.objectiveIndex));
            Array.Resize(ref State.units, data.units.Length);
            Array.Resize(ref State.stations, data.stations.Length);
            // Saves anteriores começam na aparência inicial e mantêm todos os níveis comprados.
            Array.Resize(ref State.stationImprovements, data.stations.Length);
            Array.Resize(ref State.automation, data.automation.Length);
            State.upgrades ??= Array.Empty<string>();
            State.completedObjectives ??= Array.Empty<string>();
            State.achievements ??= Array.Empty<string>();
            CheckAchievements();
        }

        public int MainObjectiveCount
        {
            get
            {
                int first = Array.FindIndex(Data.objectives, objective => objective.optional);
                return first >= 0 ? first : Data.objectives.Length;
            }
        }

        public bool ObjectiveCompleted(int index) => Data.objectives[index].optional
            ? Array.IndexOf(State.completedObjectives, Data.objectives[index].id) >= 0 : index < State.objectiveIndex;

        public int CurrentObjectiveIndex
        {
            get
            {
                if (State.objectiveIndex < MainObjectiveCount) return State.objectiveIndex;
                for (int i = MainObjectiveCount; i < Data.objectives.Length; i++)
                    if (!ObjectiveCompleted(i)) return i;
                return -1;
            }
        }

        public static double XpNeeded(int level) => Round(125 * Math.Pow(level, 1.5));
        private static double Round(double value) => Math.Floor(value + 0.5);
        private double LevelMultiplier => 1 + (State.level - 1) * 0.05;
        public double PrestigeMultiplier => 1 + State.eternalSouls * SoulBonus;
        public int CollectedLordParts => Math.Min(LordPartCount, Math.Max(0, State.prestigeCount));
        public bool EndingPending => CollectedLordParts == LordPartCount && !State.endingCompleted;
        public bool CanPrestige => State.level >= PrestigeLevel && !EndingPending;
        public double PrestigeGain => CanPrestige ?
            1 + Math.Floor(Math.Log10(1 + Math.Max(0, State.totalGold) / 1_000_000) / 2) +
            (State.level - PrestigeLevel) / 5 : 0;

        public bool Prestige()
        {
            if (!CanPrestige) return false;
            CheckAchievements();
            var next = new GameState
            {
                eternalSouls = State.eternalSouls + PrestigeGain,
                prestigeCount = State.prestigeCount + 1,
                endingCompleted = State.endingCompleted,
                achievements = State.achievements,
                sound = State.sound,
                lastSeen = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            State = new Game(Data, next).State;
            return true;
        }

        public bool CompleteEnding()
        {
            if (!EndingPending) return false;
            State.endingCompleted = true;
            CheckAchievements();
            return true;
        }

        public double Effect(string effect)
        {
            double result = 1;
            for (int i = 0; i < Data.stations.Length; i++)
            {
                Station station = Data.stations[i];
                if (station.effect == effect)
                    result *= (1 + State.stations[i] * station.bonusPerLevel) * StationMultiplier(i);
            }
            return result;
        }

        public double ClickPower
        {
            get
            {
                double basePower = 1;
                for (int i = 0; i < Data.stations.Length; i++)
                {
                    Station station = Data.stations[i];
                    if (station.effect == "click")
                        basePower += (1 + State.stations[i] * station.bonusPerLevel) * StationMultiplier(i) - 1;
                }
                return basePower * Effect("bones") * Effect("global") * LevelMultiplier * PrestigeMultiplier;
            }
        }

        public double AutoClicks
        {
            get
            {
                double total = 0;
                for (int i = 0; i < Data.automation.Length; i++)
                    total += State.automation[i] * Data.automation[i].clicksPerSecond;
                return total;
            }
        }

        public bool HasUpgrade(Upgrade upgrade) => Array.IndexOf(State.upgrades, upgrade.id) >= 0;

        public double PerUnit(int index)
        {
            Unit unit = Data.units[index];
            double rate = unit.baseRate;
            foreach (Upgrade upgrade in unit.upgrades)
                if (HasUpgrade(upgrade)) rate *= upgrade.multiplier;
            return rate * Effect(unit.produces) * Effect("global") * LevelMultiplier * PrestigeMultiplier;
        }

        public Production Rates()
        {
            var rates = new Production();
            for (int i = 0; i < Data.units.Length; i++)
                if (State.units[i] > 0) rates.Add(Data.units[i].produces, State.units[i] * PerUnit(i));
            rates.bones += AutoClicks * ClickPower;
            return rates;
        }

        public Production Advance(double seconds)
        {
            Production gain = Rates();
            gain.gold *= seconds;
            gain.bones *= seconds;
            gain.essence *= seconds;
            State.gold += gain.gold;
            State.totalGold += gain.gold;
            State.bones += gain.bones;
            State.essence += gain.essence;
            CheckObjectives();
            CheckAchievements();
            return gain;
        }

        public void Conjure()
        {
            State.bones += ClickPower;
            State.clicks++;
            FinishAction(1);
        }

        public double UnitCost(int index, int quantity = 1)
        {
            Unit unit = Data.units[index];
            double first = unit.cost * Math.Pow(unit.costGrowth, State.units[index]);
            return quantity <= 1 ? first : first * (Math.Pow(unit.costGrowth, quantity) - 1) / (unit.costGrowth - 1);
        }

        public int AffordableUnits(int index)
        {
            double first = UnitCost(index);
            if (double.IsInfinity(first) || State.bones < first) return 0;
            double growth = Data.units[index].costGrowth;
            double ratio = Math.Min(State.bones, double.MaxValue) / first * (growth - 1);
            int count = Math.Max(1, (int)Math.Floor(Math.Log(1 + ratio) / Math.Log(growth)));
            // Corrige arredondamentos na fronteira do custo da série geométrica.
            while (count > 1 && UnitCost(index, count) > State.bones) count--;
            if (UnitCost(index, count + 1) <= Math.Min(State.bones, double.MaxValue)) count++;
            return count;
        }

        public double StationCost(int index)
        {
            Station station = Data.stations[index];
            return Round(station.baseCost * Math.Pow(station.costGrowth, State.stations[index]));
        }

        public double AutomationCost(int index)
        {
            Automation item = Data.automation[index];
            return Round(item.cost * Math.Pow(item.costGrowth, State.automation[index]));
        }

        public bool BuyUnit(int index, bool maximum)
        {
            int count = maximum ? AffordableUnits(index) : 1;
            if (count == 0 || !Spend("bones", UnitCost(index, count))) return false;
            State.units[index] += count;
            State.purchases += count;
            FinishAction(count * 2);
            return true;
        }

        public bool BuyStation(int index)
        {
            if (!Spend("gold", StationCost(index))) return false;
            State.stations[index]++;
            FinishAction(10);
            return true;
        }

        public bool HasStationImprovement(int index, int slot) =>
            (State.stationImprovements[index] & (1 << slot)) != 0;

        public int StationForm(int index)
        {
            if (HasStationImprovement(index, 5)) return 2;
            return HasStationImprovement(index, 2) ? 1 : 0;
        }

        public double StationMultiplier(int index)
        {
            double multiplier = 1;
            StationImprovement[] improvements = Data.stations[index].improvements;
            if (improvements == null) return multiplier;
            for (int slot = 0; slot < improvements.Length; slot++)
                if (HasStationImprovement(index, slot)) multiplier *= improvements[slot].multiplier;
            return multiplier;
        }

        public bool CanBuyStationImprovement(int index, int slot)
        {
            StationImprovement[] improvements = Data.stations[index].improvements;
            if (improvements == null || slot < 0 || slot >= improvements.Length ||
                HasStationImprovement(index, slot) || slot / 3 != StationForm(index))
                return false;

            int first = slot / 3 * 3;
            if (slot % 3 == 2 &&
                (!HasStationImprovement(index, first) || !HasStationImprovement(index, first + 1)))
                return false;

            StationImprovement improvement = improvements[slot];
            return State.gold >= improvement.gold && State.bones >= improvement.bones &&
                State.essence >= improvement.essence;
        }

        public bool BuyStationImprovement(int index, int slot)
        {
            if (!CanBuyStationImprovement(index, slot)) return false;
            StationImprovement improvement = Data.stations[index].improvements[slot];
            // Valida todos os saldos antes de descontar qualquer recurso.
            State.gold -= improvement.gold;
            State.bones -= improvement.bones;
            State.essence -= improvement.essence;
            State.stationImprovements[index] |= 1 << slot;
            State.purchases++;
            FinishAction(slot % 3 == 2 ? 30 : 15);
            return true;
        }

        public bool BuyAutomation(int index)
        {
            if (!Spend("essence", AutomationCost(index))) return false;
            State.automation[index]++;
            State.purchases++;
            FinishAction(12);
            return true;
        }

        public bool BuyUpgrade(int index, Upgrade upgrade)
        {
            if (HasUpgrade(upgrade) || State.units[index] < upgrade.requirement || !Spend(upgrade.currency, upgrade.cost))
                return false;
            int length = State.upgrades.Length;
            Array.Resize(ref State.upgrades, length + 1);
            State.upgrades[length] = upgrade.id;
            FinishAction(15);
            return true;
        }

        public int UnitIndex(string id) => Array.FindIndex(Data.units, unit => unit.id == id);
        private int Units(string id) => State.units[UnitIndex(id)];
        private int StationLevel(string id) => State.stations[Array.FindIndex(Data.stations, station => station.id == id)];

        public bool Evolve(int index)
        {
            Unit unit = Data.units[index];
            int target = UnitIndex(unit.evolvesTo);
            if (target < 0 || State.units[index] < unit.evolutionCost) return false;
            State.units[index] -= unit.evolutionCost;
            State.units[target]++;
            State.evolutions++;
            FinishAction(20);
            return true;
        }

        public double Progress(Objective objective) => !string.IsNullOrEmpty(objective.metric)
            ? MetricProgress(objective.metric, objective.subject) : objective.id switch
        {
            "esqueletos-5" => Units("esqueleto"),
            "cliques-25" => State.clicks,
            "cemiterio-3" => StationLevel("cemiterio"),
            "zumbis-5" => Units("zumbi"),
            "nivel-5" => State.level,
            "cavaleiros-10" => Units("cavaleiro"),
            "cripta-5" => StationLevel("cripta"),
            "portal-1" => StationLevel("portal"),
            _ => 0
        };

        private double MetricProgress(string metric, string subject) => metric switch
        {
            "units" => Units(subject),
            "station" => StationLevel(subject),
            "army" => TotalUnits(),
            "species" => Array.FindAll(State.units, count => count > 0).Length,
            "clicks" => State.clicks,
            "level" => State.level,
            "gold" => State.gold,
            "bones" => State.bones,
            "essence" => State.essence,
            "totalGold" => State.totalGold,
            "upgrades" => State.upgrades.Length,
            "improvements" => ImprovementCount(),
            "forms" => EvolvedStationCount(1),
            "finalForms" => EvolvedStationCount(2),
            "automation" => AutomationCount(),
            "autoClicks" => AutoClicks,
            "evolutions" => State.evolutions,
            "prestige" => State.prestigeCount,
            "souls" => State.eternalSouls,
            "ending" => State.endingCompleted ? 1 : 0,
            _ => 0
        };

        private int ImprovementCount()
        {
            int total = 0;
            for (int i = 0; i < Data.stations.Length; i++)
                for (int slot = 0; slot < (Data.stations[i].improvements?.Length ?? 0); slot++)
                    if (HasStationImprovement(i, slot)) total++;
            return total;
        }

        private int EvolvedStationCount(int form)
        {
            int total = 0;
            for (int i = 0; i < Data.stations.Length; i++) if (StationForm(i) >= form) total++;
            return total;
        }

        private int AutomationCount()
        {
            int total = 0;
            foreach (int count in State.automation) total += count;
            return total;
        }

        public double AchievementTarget(Achievement achievement) => Math.Max(1, achievement.target);
        public double AchievementProgress(Achievement achievement) => Unlocked(achievement)
            ? AchievementTarget(achievement) : !string.IsNullOrEmpty(achievement.metric)
                ? MetricProgress(achievement.metric, achievement.subject) : 0;

        public bool Unlocked(Achievement achievement) => Array.IndexOf(State.achievements, achievement.id) >= 0 || AchievementCondition(achievement);

        private bool AchievementCondition(Achievement achievement) => !string.IsNullOrEmpty(achievement.metric)
            ? MetricProgress(achievement.metric, achievement.subject) >= AchievementTarget(achievement) : achievement.id switch
        {
            "primeiro-morto" => Units("esqueleto") >= 1,
            "cemiterio-cheio" => Units("esqueleto") >= 50,
            "maos-calejadas" => State.clicks >= 250,
            "legiao" => TotalUnits() >= 100,
            "aprendiz" => Units("necromante") >= 1,
            "fortuna" => State.gold >= 1_000_000,
            "nivel-10" => State.level >= 10,
            "dragao" => Units("dragao") >= 1,
            "alem-portal" => StationLevel("portal") >= 1,
            _ => false
        };

        private void CheckAchievements()
        {
            if (Data.achievements == null) return;
            foreach (Achievement achievement in Data.achievements)
            {
                if (Array.IndexOf(State.achievements, achievement.id) >= 0 || !AchievementCondition(achievement)) continue;
                int length = State.achievements.Length;
                Array.Resize(ref State.achievements, length + 1);
                State.achievements[length] = achievement.id;
            }
        }

        private int TotalUnits()
        {
            int total = 0;
            foreach (int count in State.units) total += count;
            return total;
        }

        private bool Spend(string resource, double cost)
        {
            if (double.IsInfinity(cost) || double.IsNaN(cost) || State.Balance(resource) < cost) return false;
            State.Add(resource, -cost);
            return true;
        }

        private void GrantXp(int amount)
        {
            State.xp += amount;
            while (State.xp >= XpNeeded(State.level))
            {
                State.xp -= XpNeeded(State.level);
                State.level++;
            }
        }

        // Ferramentas exclusivas desta cópia de apresentação.
        public bool DevGrant(string resource, double amount)
        {
            if (EndingPending || amount <= 0 || double.IsNaN(amount) || double.IsInfinity(amount) || amount > 1_000_000_000)
                return false;
            switch (resource)
            {
                case "gold": case "bones": case "essence": State.Add(resource, amount); break;
                case "souls": State.eternalSouls += amount; break;
                case "xp": GrantXp((int)amount); break;
                default: return false;
            }
            CheckObjectives();
            CheckAchievements();
            return true;
        }

        public bool DevPreparePrestige()
        {
            if (EndingPending) return false;
            while (State.level < PrestigeLevel)
                GrantXp((int)Math.Ceiling(XpNeeded(State.level) - State.xp));
            CheckObjectives();
            CheckAchievements();
            return true;
        }

        private void FinishAction(int xp)
        {
            GrantXp(xp);
            CheckObjectives();
            CheckAchievements();
        }

        private void CheckObjectives()
        {
            while (State.objectiveIndex < MainObjectiveCount)
            {
                Objective objective = Data.objectives[State.objectiveIndex];
                if (Progress(objective) < objective.target) break;
                State.gold += objective.reward;
                State.objectiveIndex++;
                GrantXp(25);
            }
            for (int i = MainObjectiveCount; i < Data.objectives.Length; i++)
            {
                Objective objective = Data.objectives[i];
                if (ObjectiveCompleted(i) || Progress(objective) < objective.target) continue;
                int length = State.completedObjectives.Length;
                Array.Resize(ref State.completedObjectives, length + 1);
                State.completedObjectives[length] = objective.id;
                State.gold += objective.reward;
                GrantXp(10);
            }
        }
    }
}
